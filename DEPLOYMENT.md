# Deployment Guide

This project uses GitHub Actions to automatically deploy to AWS Lambda when code is pushed to the main branch.

## Prerequisites

1. **AWS Lambda function** already created with the name `ct-session-tracker`
2. **IAM user** with appropriate permissions for Lambda deployment  
3. **GitHub repository secrets** configured
4. **DynamoDB tables** created (2025-senate-amendments, 2025-house-amendments, 2025-bills)
5. **SES email addresses** verified in AWS

## Verify AWS Resources

Before setting up GitHub Actions, run the verification script to ensure all AWS resources are properly configured:

```bash
./scripts/verify-aws.sh
```

This script will check:
- ✅ DynamoDB tables exist and are active
- ✅ Lambda function exists with correct configuration  
- ✅ IAM roles and permissions are set up
- ✅ SES is configured with verified email addresses

## Required GitHub Secrets

Navigate to your repository's Settings > Secrets and variables > Actions, and add these secrets:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - AWS access key for deployment user
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for deployment user

### Application Environment Variables
- `TO_EMAILS` - Comma-separated list of recipient emails (e.g., `user1@example.com,user2@example.com`)
- `FROM_EMAIL` - Sender email address (must be verified in AWS SES)

## Required AWS IAM Permissions

Create an IAM user for GitHub Actions deployment with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:PublishVersion",
                "lambda:GetFunction"
            ],
            "Resource": "arn:aws:lambda:us-east-1:*:function:ct-session-tracker"
        }
    ]
}
```

## Lambda Function Setup

Your Lambda function should be configured with:

- **Runtime**: Node.js 18.x or later
- **Handler**: `index.handler` (matches the export from index.js)
- **Timeout**: 300 seconds (5 minutes)
- **Memory**: 512 MB
- **Environment Variables**: Set automatically by GitHub Actions

### Required AWS Permissions for Lambda Function

The Lambda function needs the following IAM role permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:GetItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/2025-senate-amendments",
                "arn:aws:dynamodb:us-east-1:*:table/2025-house-amendments",
                "arn:aws:dynamodb:us-east-1:*:table/2025-bills"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
```

## Deployment Process

The GitHub Action will:

1. **Test** - Run all tests to ensure code quality
2. **Package** - Create a deployment zip excluding dev dependencies and test files
3. **Deploy** - Update Lambda function code
4. **Configure** - Set environment variables and function settings
5. **Version** - Publish a new version with timestamp

## Manual Deployment

You can also trigger deployment manually:

1. Go to your repository's Actions tab
2. Select "Deploy to AWS Lambda" workflow
3. Click "Run workflow" button
4. Select the main branch and click "Run workflow"

## Troubleshooting

### Common Issues:

1. **Function not found**: Ensure Lambda function exists with correct name
2. **Permission denied**: Check IAM permissions for deployment user
3. **Environment variables not set**: Verify GitHub secrets are configured
4. **Timeout**: Lambda may need more time for first run (cold start)

### Monitoring Deployments:

- Check GitHub Actions logs for deployment status
- Monitor AWS Lambda logs in CloudWatch
- Verify function versions in AWS Lambda console