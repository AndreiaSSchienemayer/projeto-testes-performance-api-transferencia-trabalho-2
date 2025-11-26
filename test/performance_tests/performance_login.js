import http from 'k6/http';
import { sleep, check, group } from 'k6';

// Credenciais do usuário Andreia (Usuário já cadastrado)
const USERNAME = 'Andreia'; 
const PASSWORD = '123456'; 
const FAVORED = 'Arthur'

// Dados da Transação
const TRANSFER_DATA = {
    from: USERNAME, 
    to: FAVORED, // O favorecido deve existir na lista da Andreia
    value: 2    // Valor da transferência
};

export const options = {
    // Configurações de carga
    vus: 15,       // 10 Usuários Virtuais simultâneos
    duration: '20s', // Rodar o teste por 10 segundos
    //iteration: 1,

    
    // Thresholds (SLAs - Service Level Agreements)
    thresholds: {
        // Tempo de resposta: 95% das requisições devem ser concluídas em menos de 200ms
        'http_req_duration': ['p(95)<=200'], 
        // Taxa de requisições que falharam deve ser menor que 1%
        'http_req_failed': ['rate<0.01'], 
        // 100% dos cheques de sucesso devem passar
        'checks': ['rate==1.00'] 
    }
};

export default function() {
    let authToken = ''; // Variável para armazenar o token JWT

    // ----------------------------------------------------
    // GRUPO 1: LOGIN (OBTENDO O TOKEN)
    // ----------------------------------------------------
    group('1. Fluxo de Login (POST /users/login)', function() {
        const loginUrl = 'http://localhost:3000/users/login';
        
        const loginPayload = JSON.stringify({ 
            username: USERNAME, 
            password: PASSWORD
            
        });
        
        const loginParams = {
            headers: { 'Content-Type': 'application/json' }
        };

        const responseLogin = http.post(loginUrl, loginPayload, loginParams);

        // 📝 Checagem: Verifica se o login foi bem-sucedido e se o token foi recebido
        const loginSucceeded = check(responseLogin, {
            'Login - Status 200 OK': (r) => r.status === 200,
            'Login - Token está presente Ok': (r) => r.json('token') !== null
        });
        
        // Se a checagem de sucesso passou, armazena o token
        if (loginSucceeded) {
            authToken = responseLogin.json('token');
        }

        // Se o login falhar (sem token), termina a iteração do VU
        if (!authToken) {
            console.log(`VUs ${__VU}: Login falhou. Não é possível prosseguir para a transferência.`);
            return;
        }
    });

    // Sai da iteração se o token não foi obtido (redundante, mas seguro)
    if (!authToken) {
        return; 
    }

    // ----------------------------------------------------
    // GRUPO 2: ATIVIDADE SEGURA (REALIZANDO TRANSFERÊNCIA)
    // ----------------------------------------------------
    group('2. Fluxo de Transferência (POST /transfers)', function() { 
        const transferUrl = 'http://localhost:3000/transfers';
        
        const transferPayload = JSON.stringify(TRANSFER_DATA);
        
        const transferParams = {
            headers: {
                'Content-Type': 'application/json',
                // 🔑 Usa o token JWT obtido no Grupo 1 para autenticar
                'Authorization': `Bearer ${authToken}`
            }
        };

        const responseTransfer = http.post(transferUrl, transferPayload, transferParams);

        // 📝 Checagem: Verifica se a transferência foi criada com sucesso (Status 201)
        check(responseTransfer, {
            'Transferência - Status 201 Transferência efetuada': (r) => r.status === 201,
            'Transferência - Status não pode ser 401 (Token Válido)': (r) => r.status !== 401
        });
    });

    // ----------------------------------------------------
    // GRUPO 3: TEMPO DE PENSAMENTO
    // ----------------------------------------------------
    group('Simulando o pensamento do usuário', function() {
        sleep(1); // User Think Time
    });
}