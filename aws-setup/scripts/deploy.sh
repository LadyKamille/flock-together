#!/bin/bash
set -euo pipefail

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Default values
AWS_REGION=${AWS_REGION:-"us-east-1"}
FRONTEND_BUCKET_NAME=${FRONTEND_BUCKET_NAME:-"flock-together-frontend"}
BACKEND_STACK_NAME=${BACKEND_STACK_NAME:-"flock-together-backend"}
DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME:-"flock-together-games"}

# Function to deploy CloudFormation stack
deploy_stack() {
  local template=$1
  local stack_name=$2
  local params=$3

  echo "Deploying stack: $stack_name"
  aws cloudformation deploy \
    --template-file "$template" \
    --stack-name "$stack_name" \
    --parameter-overrides $params \
    --capabilities CAPABILITY_IAM \
    --region "$AWS_REGION"
}

# Step 1: Deploy backend resources
echo "Deploying backend infrastructure..."
deploy_stack "aws-setup/cloudformation/backend.yaml" "$BACKEND_STACK_NAME" "TableName=$DYNAMODB_TABLE_NAME ApiStageName=prod"

# Step 2: Get outputs from backend stack
echo "Getting backend stack outputs..."
WEBSOCKET_API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$BACKEND_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='WebSocketApiEndpoint'].OutputValue" --output text --region "$AWS_REGION")
LAMBDA_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name "$BACKEND_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='LambdaRoleArn'].OutputValue" --output text --region "$AWS_REGION")

echo "WebSocket API Endpoint: $WEBSOCKET_API_ENDPOINT"
echo "Lambda Role ARN: $LAMBDA_ROLE_ARN"

# Step 3: Deploy frontend infrastructure
echo "Deploying frontend infrastructure..."
deploy_stack "aws-setup/cloudformation/frontend.yaml" "flock-together-frontend" "BucketName=$FRONTEND_BUCKET_NAME"

# Step 4: Get outputs from frontend stack
echo "Getting frontend stack outputs..."
S3_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "flock-together-frontend" --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text --region "$AWS_REGION")
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks --stack-name "flock-together-frontend" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text --region "$AWS_REGION")
CLOUDFRONT_ID=$(aws cloudformation describe-stacks --stack-name "flock-together-frontend" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text --region "$AWS_REGION")

echo "S3 Bucket Name: $S3_BUCKET_NAME"
echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "CloudFront Distribution ID: $CLOUDFRONT_ID"

# Step 5: Build and deploy backend Lambda
echo "Building backend..."
cd backend
npm ci
npm run build
mkdir -p dist

echo "Packaging backend for Lambda..."
zip -r ../lambda-package.zip dist node_modules

cd ..

echo "Deploying Lambda function..."
aws lambda create-function \
  --function-name "FlockTogetherBackend" \
  --runtime "nodejs18.x" \
  --role "$LAMBDA_ROLE_ARN" \
  --handler "dist/index.handler" \
  --zip-file "fileb://lambda-package.zip" \
  --region "$AWS_REGION" \
  --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE_NAME,NODE_ENV=production}" \
  --timeout 30 \
  --memory-size 256 || \
aws lambda update-function-code \
  --function-name "FlockTogetherBackend" \
  --zip-file "fileb://lambda-package.zip" \
  --region "$AWS_REGION"

# Step 6: Build and deploy frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Deploying frontend to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET_NAME" --delete --region "$AWS_REGION"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*" --region "$AWS_REGION"

echo "Deployment completed successfully!"
echo "Frontend URL: https://$CLOUDFRONT_DOMAIN"
echo "Backend WebSocket URL: $WEBSOCKET_API_ENDPOINT"