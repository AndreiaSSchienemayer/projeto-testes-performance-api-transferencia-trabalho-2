import http from 'k6/http';
import { sleep, check, group } from 'k6';

// Credenciais do usuário Andreia (Usuário já cadastrado)
const USERNAME = 'Andreia'; 
const PASSWORD = '123456'; 
const FAVORED = 'Arthur'

// Dados da Transação
const TRANSFER_DATA = {
    from: USERNAME, 
    to: FAVORED, 
    value: 2    
};

export const options = {
    vus: 15,       // 10 Usuários Virtuais simultâneos
    duration: '20s', // Rodar o teste por 20 segundos
    //iteration: 1,

    
    
    thresholds: {
        // Tempo de resposta: 95% das requisições devem ser concluídas em menos de 200ms
        'http_req_duration': ['p(95)<=250'], 
        // Taxa de requisições que falharam deve ser menor que 1%
        'http_req_failed': ['rate<0.01'], 
        // 100% dos cheques de sucesso devem passar
        'checks': ['rate==1.00'] 
    }
};

export default function() {
    let authToken = ''; 

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

        const loginSucceeded = check(responseLogin, {
            'Login - Status 200 OK': (r) => r.status === 200,
            'Login - Token está presente Ok': (r) => r.json('token') !== null
        });
        
        if (loginSucceeded) {
            authToken = responseLogin.json('token');
        }
        
        if (!authToken) {
            console.log(`VUs ${__VU}: Login falhou. Não é possível prosseguir para a transferência.`);
            return;
        }
    });
    
    if (!authToken) {
        return; 
    }
    
    group('2. Fluxo de Transferência (POST /transfers)', function() { 
        const transferUrl = 'http://localhost:3000/transfers';
        
        const transferPayload = JSON.stringify(TRANSFER_DATA);
        
        const transferParams = {
            headers: {
                'Content-Type': 'application/json',                
                'Authorization': `Bearer ${authToken}`
            }
        };

        const responseTransfer = http.post(transferUrl, transferPayload, transferParams);
        
        check(responseTransfer, {
            'Transferência - Status 201 Transferência efetuada': (r) => r.status === 201,
            'Transferência - Status não pode ser 401 (Token Válido)': (r) => r.status !== 401
        });
    });

    group('Simulando o pensamento do usuário', function() {
        sleep(1); 
    });
}