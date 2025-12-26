# LunaCart Alexa Skill Setup Guide

## Prerequisites

- Amazon Developer Account (developer.amazon.com)
- AWS Account (aws.amazon.com)
- Supabase project with alexa_sync_codes table

---

## Step 1: Run Supabase Migration

Copy the contents of `docs/supabase/alexa_sync_codes.sql` and run it in your Supabase SQL Editor.

---

## Step 2: Create AWS Lambda Function

1. Go to AWS Lambda Console (console.aws.amazon.com/lambda)
2. Click **Create function**
3. Choose **Author from scratch**
4. Settings:
   - Name: `lunacart-alexa-skill`
   - Runtime: `Node.js 18.x`
   - Architecture: `x86_64`
5. Click **Create function**

### Upload Code

1. In the alexa-skill folder, run:

   ```bash
   npm install
   zip -r lunacart-alexa-skill.zip .
   ```

2. In Lambda console, click **Upload from** > **.zip file**
3. Upload the zip file

### Set Environment Variables

In Lambda > Configuration > Environment variables, add:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (find in Project Settings > API)

### Add Alexa Trigger

1. Click **Add trigger**
2. Select **Alexa Skills Kit**
3. For Skill ID, leave blank for now (we'll add it after creating the skill)
4. Click **Add**

### Copy Lambda ARN

Copy the ARN from the top right (looks like `arn:aws:lambda:us-east-1:123456789:function:lunacart-alexa-skill`)

---

## Step 3: Create Alexa Skill

1. Go to Alexa Developer Console (developer.amazon.com/alexa/console/ask)
2. Click **Create Skill**
3. Settings:
   - Skill name: `LunaCart`
   - Default language: `English (US)`
   - Model: **Custom**
   - Hosting: **Provision your own**
4. Click **Create skill**
5. Choose **Start from Scratch** template

### Configure Endpoint

1. In Build tab, go to **Endpoint**
2. Select **AWS Lambda ARN**
3. Default Region: Paste your Lambda ARN
4. Click **Save Endpoints**

### Import Interaction Model

1. Go to **JSON Editor** (left sidebar)
2. Copy contents of `alexa-skill/models/en-US.json`
3. Paste and click **Save Model**
4. Click **Build Model** (takes ~1 min)

### Get Skill ID

1. Go to skill list, find your skill
2. Click **View Skill ID**
3. Copy the skill ID

### Add Skill ID to Lambda

1. Go back to AWS Lambda
2. Click on Alexa Skills Kit trigger
3. Add the Skill ID
4. Save

---

## Step 4: Test

### In Alexa Developer Console

1. Go to **Test** tab
2. Enable testing for **Development**
3. Type: "open luna cart"
4. Type: "link my account with code LUNA-ABC123"

### On Echo Device

Your Echo should automatically have access since you're logged into the same Amazon account.

Say: "Alexa, open Luna Cart"

---

## Troubleshooting

### "I couldn't find that code"

- Make sure you've generated a sync code in the app's Settings page
- Run the Supabase migration SQL first

### Lambda timeout/errors

- Check CloudWatch logs
- Verify environment variables are set correctly
- Ensure Supabase service key has access to alexa_sync_codes table

---

## Files Reference

| File | Purpose |
|------|---------|
| `alexa-skill/index.js` | Lambda handler code |
| `alexa-skill/package.json` | Dependencies |
| `alexa-skill/models/en-US.json` | Alexa interaction model |
| `docs/supabase/alexa_sync_codes.sql` | Database schema |
