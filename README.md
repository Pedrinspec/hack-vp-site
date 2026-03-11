# Hack VP Site

Aplicação frontend Angular 20 para o hackathon VP. Oferece telas de autenticação (login e cadastro) e upload de vídeos, integrando-se a um backend via HTTP.

---

## Sumário

- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Execução local](#execução-local)
  - [Modo desenvolvimento (ng serve)](#modo-desenvolvimento-ng-serve)
  - [Modo produção com Docker](#modo-produção-com-docker)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy na AWS (ECS Fargate)](#deploy-na-aws-ecs-fargate)
  - [Infraestrutura necessária](#infraestrutura-necessária)
  - [Deploy manual](#deploy-manual)
  - [Deploy automatizado (CI/CD)](#deploy-automatizado-cicd)

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │   /login   │  │/cadastro │  │   /upload   │  │
│  │ (default)  │  │          │  │             │  │
│  └────────────┘  └──────────┘  └─────────────┘  │
│         Angular 20 (Standalone Components)       │
└─────────────────────┬───────────────────────────┘
                      │ HTTP (API_BASE_URL)
                      ▼
          ┌───────────────────────┐
          │      Backend API      │
          │  POST /auth/login     │
          │  POST /auth/register  │
          │  POST /videos/upload  │
          └───────────────────────┘
```

### Stack

| Camada       | Tecnologia                              |
|--------------|-----------------------------------------|
| Framework    | Angular 20 (standalone components)      |
| Linguagem    | TypeScript 5.8                          |
| Formulários  | Reactive Forms                          |
| HTTP         | Angular HttpClient + RxJS               |
| Servidor     | nginx 1.27-alpine (produção)            |
| Container    | Docker (multi-stage build)              |
| CI/CD        | GitHub Actions                          |
| Cloud        | AWS ECS Fargate + ECR                   |

### Componentes e serviços

```
src/app/
├── components/
│   ├── login/         # Tela de login (rota: /)
│   ├── register/      # Tela de cadastro (rota: /cadastro)
│   └── upload/        # Tela de upload de vídeo (rota: /upload)
├── services/
│   ├── auth.service.ts    # POST /auth/login e /auth/register
│   └── upload.service.ts  # POST /videos/upload (multipart/form-data)
├── app.routes.ts      # Definição de rotas
└── app.config.ts      # Providers globais (HttpClient, Router)
```

### Build Docker (multi-stage)

```
Stage 1 — builder (node:22-alpine)
  └── npm ci
  └── Injeta API_BASE_URL via sed no environment.ts
  └── npm run build → dist/hack-vp-site/

Stage 2 — runtime (nginx:1.27-alpine)
  └── Copia dist/ para /usr/share/nginx/html
  └── nginx.conf com SPA fallback + gzip + cache headers
  └── Expõe porta 80
```

---

## Pré-requisitos

| Ferramenta | Versão mínima | Uso                         |
|------------|---------------|-----------------------------|
| Node.js    | 22            | Build e desenvolvimento     |
| npm        | 10            | Gerenciamento de pacotes    |
| Docker     | 24            | Build e execução containerizada |
| AWS CLI    | 2             | Deploy manual na AWS        |

---

## Execução local

### Modo desenvolvimento (ng serve)

```bash
# 1. Instalar dependências
npm install

# 2. (Opcional) Configurar URL do backend
#    Edite src/environments/environment.ts:
#    export const environment = { apiBaseUrl: 'http://localhost:8080' };

# 3. Subir o servidor de desenvolvimento
npm start
# Acesse: http://localhost:4200
```

### Modo produção com Docker

```bash
# 1. Copiar e preencher o .env
cp infra/.env.example infra/.env
# Edite infra/.env e defina pelo menos:
#   API_BASE_URL=http://localhost:8080
#   PORT=80

# 2. Build e subida do container
docker compose -f infra/docker-compose.yml --env-file infra/.env up --build

# Acesse: http://localhost:80
```

Para parar:

```bash
docker compose -f infra/docker-compose.yml down
```

---

## Variáveis de ambiente

Copie `infra/.env.example` para `infra/.env` e preencha os valores.

| Variável              | Descrição                                           | Exemplo                    |
|-----------------------|-----------------------------------------------------|----------------------------|
| `API_BASE_URL`        | URL base do backend (injetada no build)             | `http://api.meusite.com`   |
| `PORT`                | Porta exposta pelo container                        | `80`                       |
| `AWS_REGION`          | Região AWS                                          | `us-east-1`                |
| `AWS_ACCESS_KEY_ID`   | Chave de acesso AWS                                 | —                          |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS                                 | —                          |
| `ECR_REPOSITORY`      | Nome do repositório ECR                             | `hack-vp-site`             |
| `ECS_CLUSTER`         | Nome do cluster ECS                                 | `hack-vp-cluster`          |
| `ECS_SERVICE`         | Nome do serviço ECS                                 | `hack-vp-service`          |
| `ECS_TASK_DEFINITION` | Nome da task definition ECS                         | `hack-vp-task`             |
| `CONTAINER_NAME`      | Nome do container na task definition                | `hack-vp-site`             |

> **Nunca commite o arquivo `.env`** com credenciais reais. Ele já está no `.gitignore`.

---

## Deploy na AWS (ECS Fargate)

### Infraestrutura necessária

Antes do primeiro deploy, crie manualmente (ou via Terraform/CDK) os recursos abaixo:

1. **ECR Repository**
   ```bash
   aws ecr create-repository --repository-name hack-vp-site --region us-east-1
   ```

2. **ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name hack-vp-cluster --region us-east-1
   ```

3. **Task Definition** — crie um arquivo `task-definition.json`:
   ```json
   {
     "family": "hack-vp-task",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "hack-vp-site",
         "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hack-vp-site:latest",
         "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
         "essential": true
       }
     ]
   }
   ```
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

4. **ECS Service** (com VPC, subnets e security group configurados para a porta 80):
   ```bash
   aws ecs create-service \
     --cluster hack-vp-cluster \
     --service-name hack-vp-service \
     --task-definition hack-vp-task \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-XXXX],securityGroups=[sg-XXXX],assignPublicIp=ENABLED}"
   ```

---

### Deploy manual

```bash
# 1. Autenticar no ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build da imagem com a URL do backend
docker build \
  -f infra/Dockerfile \
  --build-arg API_BASE_URL=https://api.meusite.com \
  -t hack-vp-site:latest .

# 3. Tag e push para o ECR
docker tag hack-vp-site:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hack-vp-site:latest

docker push \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hack-vp-site:latest

# 4. Forçar novo deploy no ECS
aws ecs update-service \
  --cluster hack-vp-cluster \
  --service hack-vp-service \
  --force-new-deployment

# 5. Aguardar estabilização
aws ecs wait services-stable \
  --cluster hack-vp-cluster \
  --services hack-vp-service
```

---

### Deploy automatizado (CI/CD)

O pipeline `.github/workflows/ci-cd.yml` executa automaticamente em push para `main`.

#### Configurar os secrets no GitHub

Acesse **Settings → Secrets and variables → Actions** no repositório e adicione:

| Secret                  | Valor                                          |
|-------------------------|------------------------------------------------|
| `AWS_ACCESS_KEY_ID`     | Chave de acesso IAM                            |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta IAM                              |
| `AWS_REGION`            | Ex: `us-east-1`                                |
| `ECR_REPOSITORY`        | Nome do repositório ECR (`hack-vp-site`)       |
| `ECS_CLUSTER`           | Nome do cluster (`hack-vp-cluster`)            |
| `ECS_SERVICE`           | Nome do serviço (`hack-vp-service`)            |
| `ECS_TASK_DEFINITION`   | Nome da task definition (`hack-vp-task`)       |
| `CONTAINER_NAME`        | Nome do container (`hack-vp-site`)             |
| `API_BASE_URL`          | URL do backend em produção                     |

#### Fluxo do pipeline

```
push para main
      │
      ▼
┌─────────────┐
│  build job  │  npm ci → npm run build
└──────┬──────┘
       │ (sucesso)
       ▼
┌─────────────────────────────────────────────────────┐
│  deploy job                                         │
│  1. Configure AWS credentials                       │
│  2. Login no ECR                                    │
│  3. Docker build + push (tags: :latest e :<sha>)    │
│  4. Download task definition atual do ECS           │
│  5. Atualiza imagem na task definition              │
│  6. Registra nova revisão e faz deploy no Fargate   │
│  7. Aguarda estabilização do serviço                │
└─────────────────────────────────────────────────────┘
```

#### Permissões IAM mínimas para o deploy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole"
    }
  ]
}
```

---

## Endpoints do backend esperados

| Método | Rota              | Payload                                        |
|--------|-------------------|------------------------------------------------|
| POST   | `/auth/login`     | `{ "email": "...", "password": "..." }`        |
| POST   | `/auth/register`  | `{ "name": "...", "email": "...", "password": "..." }` |
| POST   | `/videos/upload`  | `multipart/form-data` com campo `file`         |
