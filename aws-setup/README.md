# AWS Deployment Setup for Flock Together

This directory contains configuration files and scripts for deploying the Flock Together game to AWS.

## Architecture

The deployment uses the following AWS services:

1. **Frontend**:
   - Amazon S3 for static content hosting
   - Amazon CloudFront for content delivery
   - Route 53 for domain name management (optional)

2. **Backend**:
   - AWS Lambda for serverless backend processing
   - API Gateway for RESTful API endpoints
   - API Gateway WebSocket API for real-time communication
   - DynamoDB for game state persistence

3. **CI/CD**:
   - AWS CodePipeline for continuous integration and deployment
   - AWS CodeBuild for build and test processes
   - GitHub Actions integration

## Deployment Steps

1. **Initial Setup**:
   - Create S3 buckets for frontend and deployment artifacts
   - Create DynamoDB tables for game state
   - Configure IAM roles and policies

2. **Backend Deployment**:
   - Package Lambda functions
   - Configure API Gateway REST and WebSocket endpoints
   - Set up DynamoDB connections

3. **Frontend Deployment**:
   - Build React application
   - Upload to S3 bucket
   - Configure CloudFront distribution

4. **Connect CI/CD**:
   - Configure GitHub repository with AWS credentials
   - Set up GitHub Actions workflows
   - Create CodePipeline for automated deployments

## Deployment Files

- `cloudformation/`: AWS CloudFormation templates
- `lambda/`: AWS Lambda function configurations
- `scripts/`: Deployment and maintenance scripts
- `sam/`: AWS Serverless Application Model templates

## Environment Variables

Create a `.env` file with the following variables:

```
AWS_REGION=us-east-1
FRONTEND_BUCKET_NAME=flock-together-frontend
BACKEND_STACK_NAME=flock-together-backend
DYNAMODB_TABLE_NAME=flock-together-games
```