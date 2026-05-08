# workshop-aws-bedrock

Agente AI para AWS Cloud Practitioner desplegado sobre **Amazon Bedrock (Nova Lite) + Lambda + API Gateway + S3**, con infraestructura en **Terraform**.

## Arquitectura

```
Browser (S3 static site)
        │
        ▼
API Gateway HTTP (POST /ask)
        │
        ▼
AWS Lambda (Python 3.12)
        │
        ▼
Amazon Bedrock — amazon.nova-lite-v1:0
```

## Estructura

```
.
├── app/
│   ├── frontend/      # SPA estática (HTML/CSS/JS) — estética NIMBUS
│   ├── lambda/        # handler Python + lambda.zip
│   └── docs/          # notas del laboratorio
├── infra/             # módulos Terraform (S3, IAM, Lambda, API GW)
└── .github/workflows/ # CI opcional
```

## Despliegue

### Prerrequisitos
- Terraform, AWS CLI, Python 3
- Modelos Bedrock habilitados en `us-east-1`: **Amazon Nova Lite** y **Titan Embeddings V2**

### Pasos

```bash
# 1. Empaquetar la Lambda
cd app/lambda
zip -r lambda.zip app.py

# 2. Desplegar infraestructura
cd ../../infra
terraform init
terraform validate
terraform plan
terraform apply

# 3. Tomar el output api_url y reemplazar API_URL en app/frontend/app.js

# 4. Subir el frontend al bucket S3
aws s3 cp ../app/frontend/ s3://$(terraform output -raw frontend_bucket)/ --recursive
```

## Limpieza

```bash
cd infra
terraform destroy
```

---
Hecho por Juan Pablo Castaño · 2026
