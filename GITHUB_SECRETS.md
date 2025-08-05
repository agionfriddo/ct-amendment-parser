# GitHub Secrets Configuration

To enable automatic deployment, you need to configure these secrets in your GitHub repository.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** > **Actions** 
4. Click **New repository secret**
5. Add each secret below

## Required Secrets

### AWS Deployment Credentials
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```
*These should be for an IAM user with Lambda deployment permissions*

### Application Environment Variables  
```
TO_EMAILS
FROM_EMAIL
```

### Example Values:
- `TO_EMAILS`: `john@example.com,jane@example.com`
- `FROM_EMAIL`: `noreply@yourverifieddomain.com`

## IAM User Policy for Deployment

Create an IAM user specifically for GitHub Actions with this policy:

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
            "Resource": "arn:aws:lambda:us-east-1:*:function:amendmentCron"
        }
    ]
}
```

## Security Notes

- ✅ Never commit AWS credentials to code
- ✅ Use least-privilege IAM policies  
- ✅ Rotate access keys regularly
- ✅ Monitor AWS CloudTrail for deployment activity

## Testing Setup

After configuring secrets:

1. Run `./scripts/verify-aws.sh` to check AWS resources
2. Push a small change to main branch
3. Check GitHub Actions tab for deployment status
4. Monitor AWS Lambda logs in CloudWatch