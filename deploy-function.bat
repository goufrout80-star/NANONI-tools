@echo off
echo Deploying face-swap function...
echo.
echo Please run these commands manually in PowerShell as Administrator:
echo.
echo 1. Navigate to your project folder:
echo    cd "c:\Users\HP\Documents\dev26\SOON\NANONI-tools"
echo.
echo 2. Login to Supabase:
echo    npx supabase login
echo.
echo 3. Link to your project:
echo    npx supabase link --project-ref mtyjgrgldlpglzmqyucw
echo.
echo 4. Deploy the function:
echo    npx supabase functions deploy face-swap
echo.
echo If npx doesn't work, try installing Supabase CLI directly:
echo    npm install -g supabase
echo.
echo Or use the manual deployment method:
echo 1. Go to https://supabase.com/dashboard/project/mtyjgrgldlpglzmqyucw/functions
echo 2. Click "Create Function" or "Edit" the existing face-swap function
echo 3. Copy the fixed code from: supabase/functions/face-swap/index.ts
echo 4. Save and deploy
echo.
pause
