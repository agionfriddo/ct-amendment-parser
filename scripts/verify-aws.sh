#!/bin/bash

# AWS Resources Verification Script
# Run this script to verify that all required AWS resources exist and are properly configured

set -e

FUNCTION_NAME="ct-session-tracker"
REGION="us-east-1"

echo "🔍 Verifying AWS resources for CT Session Tracker..."
echo ""

# Check AWS CLI configuration
echo "📋 Checking AWS CLI configuration..."
if ! aws sts get-caller-identity --no-cli-pager > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured or credentials invalid"
    echo "   Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS CLI configured for account: $ACCOUNT_ID"
echo ""

# Check DynamoDB tables
echo "📊 Checking DynamoDB tables..."

TABLES=("2025-senate-amendments" "2025-house-amendments" "2025-bills")
for table in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region $REGION --no-cli-pager > /dev/null 2>&1; then
        STATUS=$(aws dynamodb describe-table --table-name "$table" --region $REGION --query 'Table.TableStatus' --output text)
        echo "✅ Table '$table' exists (Status: $STATUS)"
    else
        echo "❌ Table '$table' not found"
        echo "   Create with: aws dynamodb create-table --table-name $table ..."
    fi
done
echo ""

# Check Lambda function
echo "⚡ Checking Lambda function..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --no-cli-pager > /dev/null 2>&1; then
    RUNTIME=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Runtime' --output text)
    TIMEOUT=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Timeout' --output text)
    MEMORY=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'MemorySize' --output text)
    HANDLER=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Handler' --output text)
    
    echo "✅ Lambda function '$FUNCTION_NAME' exists"
    echo "   Runtime: $RUNTIME"
    echo "   Handler: $HANDLER"
    echo "   Timeout: ${TIMEOUT}s"
    echo "   Memory: ${MEMORY}MB"
    
    # Check if handler is correct for ES modules
    if [ "$HANDLER" != "index.handler" ]; then
        echo "⚠️  Handler should be 'index.handler' for ES modules"
    fi
    
    # Check if timeout is sufficient
    if [ "$TIMEOUT" -lt 300 ]; then
        echo "⚠️  Consider increasing timeout to 300s for web scraping"
    fi
else
    echo "❌ Lambda function '$FUNCTION_NAME' not found"
    echo "   Create in AWS Console or use AWS CLI"
fi
echo ""

# Check Lambda function permissions
echo "🔐 Checking Lambda function permissions..."
ROLE_ARN=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Role' --output text 2>/dev/null || echo "")

if [ -n "$ROLE_ARN" ]; then
    ROLE_NAME=$(basename "$ROLE_ARN" | cut -d'/' -f2)
    echo "✅ Lambda execution role: $ROLE_NAME"
    
    # Check if role has required policies (basic check)
    if aws iam get-role-policy --role-name "$ROLE_NAME" --policy-name "ct-session-tracker-policy" --no-cli-pager > /dev/null 2>&1; then
        echo "✅ Custom policy attached to role"
    else
        echo "⚠️  Custom policy 'ct-session-tracker-policy' not found on role"
        echo "   Role may have different policy names or managed policies"
    fi
else
    echo "❌ Could not retrieve Lambda execution role"
fi
echo ""

# Check SES configuration (basic check)
echo "📧 Checking SES configuration..."
if aws ses get-send-quota --region $REGION --no-cli-pager > /dev/null 2>&1; then
    SEND_QUOTA=$(aws ses get-send-quota --region $REGION --query 'Max24HourSend' --output text)
    echo "✅ SES is available (24hr quota: $SEND_QUOTA)"
    
    # List verified email addresses
    VERIFIED_EMAILS=$(aws ses list-verified-email-addresses --region $REGION --query 'VerifiedEmailAddresses' --output text 2>/dev/null || echo "")
    if [ -n "$VERIFIED_EMAILS" ]; then
        echo "✅ Verified email addresses found"
        echo "   Addresses: $VERIFIED_EMAILS"
    else
        echo "⚠️  No verified email addresses found"
        echo "   Verify sender email in SES console"
    fi
else
    echo "❌ SES not available or not configured"
    echo "   Enable SES in AWS Console"
fi
echo ""

# Summary
echo "📋 Resource Verification Summary:"
echo "   - DynamoDB tables: Check individual results above"
echo "   - Lambda function: $([ -n "$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null)" ] && echo "✅ Exists" || echo "❌ Missing")"
echo "   - IAM role: $([ -n "$ROLE_ARN" ] && echo "✅ Configured" || echo "❌ Missing")"
echo "   - SES: $(aws ses get-send-quota --region $REGION --no-cli-pager > /dev/null 2>&1 && echo "✅ Available" || echo "❌ Not configured")"
echo ""

echo "🚀 Next steps for GitHub Actions deployment:"
echo "   1. Configure GitHub repository secrets (see DEPLOYMENT.md)"
echo "   2. Ensure FROM_EMAIL is verified in SES"
echo "   3. Push to main branch to trigger deployment"