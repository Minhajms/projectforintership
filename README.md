# MERN Stack Deployment with CI/CD on AWS EC2 Using Docker, Terraform, and GitHub Actions

## Overview
This document outlines the steps to deploy a MERN (MongoDB, Express.js, React.js, Node.js) stack application on AWS EC2 using Docker-Compose. The EC2 instance was provisioned using Terraform, and GitHub Actions was leveraged for CI/CD to automate the deployment process.

---

## Steps Implemented

### 1. Selection of an Open-Source Repository
- **GitHub Repository**: MERN Stack Example
- The repository was chosen for its well-structured implementation of a MERN stack application, meeting the criteria for frontend, backend, and database layers.

### 2. Local Testing
- Cloned the repository locally to validate its functionality.
- Set up a basic development environment and ensured the application ran as expected.

### 3. Creation of Docker Configuration

#### 3.1 Dockerfile for Backend
```dockerfile
# Use the official Node.js image as a base
FROM node:14

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Use an nginx image to serve the static files
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Expose the frontend port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 3.2 Dockerfile for Frontend
```dockerfile
# Use the official Node.js image as a base
FROM node:14

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

#### 3.3 Docker-Compose File
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./client
    ports:
      - "3000:80"

  backend:
    build:
      context: .
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://db:27017/mernstack

  db:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

- **Note**: Sensitive information like `MONGO_URI` was passed securely using `.env` files.

---

### 4. Provisioning EC2 Instance Using Terraform

#### Terraform Configuration
```hcl
provider "aws" {
  region = "eu-north-1"
}

resource "aws_instance" "example" {
  ami               = "ami-089146c5626baa6bf"
  instance_type     = "t3.micro"
  availability_zone = "eu-north-1a"
  key_name          = "docker1"

  tags = {
    Name = "Terraform-EC2"
  }

  vpc_security_group_ids = ["sg-004ded531f05429f9"]
}
```

#### Steps to Execute
1. Installed Terraform locally.
2. Initialized the Terraform configuration with `terraform init`.
3. Planned the infrastructure setup with `terraform plan` to verify changes.
4. Applied the configuration with `terraform apply` to launch the EC2 instance.

---

### 5. Deployment on EC2
- Installed Docker and Docker Compose on the provisioned EC2 instance.
- Pulled the Docker images and tested the deployment successfully.

---

### 6. Automation with GitHub Actions

#### 6.1 CI/CD Workflow
```yaml
name: CI/CD for MERN Stack

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Step 1: Checkout Code
      - name: Checkout Code
        uses: actions/checkout@v2

      # Step 2: Log in to Docker Hub
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      # Step 3: Build and Push Backend Docker Image
      - name: Build and Push Backend Docker Image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/mern-backend:latest -f ./Dockerfile .
          docker push ${{ secrets.DOCKER_USERNAME }}/mern-backend:latest

      # Step 4: Build and Push Frontend Docker Image
      - name: Build and Push Frontend Docker Image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/mern-frontend:latest -f ./client/Dockerfile ./client
          docker push ${{ secrets.DOCKER_USERNAME }}/mern-frontend:latest

      # Step 5: Set up SSH for EC2
      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.5.3
        with:
          ssh-private-key: ${{ secrets.EC2_SSH_KEY }}

      # Step 6: Create .env File for Backend
      - name: Create .env File
        run: |
          echo "MONGO_URI=mongodb://mern-database:27017" > .env
          echo "PORT=5000" >> .env
          echo "SECRET_KEY=${{ secrets.SECRET_KEY }}" >> .env

      # Step 7: Deploy on EC2
      - name: Deploy on EC2
        run: |
          ssh -o StrictHostKeyChecking=no ubuntu@${{ secrets.EC2_PUBLIC_IP }} "mkdir -p /home/ubuntu/backend"
          scp -o StrictHostKeyChecking=no .env ubuntu@${{ secrets.EC2_PUBLIC_IP }}:/home/ubuntu/backend/.env
          ssh -o StrictHostKeyChecking=no ubuntu@${{ secrets.EC2_PUBLIC_IP }} << 'EOF'
          set -e
          echo "Starting deployment on EC2..."
          docker stop mern-backend mern-frontend mern-database 2>/dev/null || true
          docker rm mern-backend mern-frontend mern-database 2>/dev/null || true
          docker pull ${{ secrets.DOCKER_USERNAME }}/mern-backend:latest
          docker pull ${{ secrets.DOCKER_USERNAME }}/mern-frontend:latest
          docker pull mongo:latest
          docker run -d --name mern-database -p 27017:27017 -v mern-db-data:/data/db mongo:latest
          docker run -d --name mern-backend -p 5000:5000 --env-file /home/ubuntu/backend/.env --link mern-database:mongo ${{ secrets.DOCKER_USERNAME }}/mern-backend:latest
          docker run -d --name mern-frontend -p 80:80 ${{ secrets.DOCKER_USERNAME }}/mern-frontend:latest
          EOF
```

#### 6.2 Secrets Management
- Leveraged GitHub Secrets for securely managing credentials:
  - Docker Hub username and password.
  - EC2 SSH private key.
  - EC2 public IP.

---

## Results
- Successfully deployed a 3-tier MERN application using Docker-Compose on AWS EC2 provisioned via Terraform.
- Enabled continuous deployment with GitHub Actions, ensuring any code changes pushed to the main branch trigger an automated redeployment.

---

## Key Takeaways
- Designed a fully automated CI/CD pipeline tailored to a real-world application.
- Ensured adherence to best practices in Dockerization, secrets management, and cloud deployment.
- Demonstrated the ability to deliver a complete end-to-end solution effectively.
