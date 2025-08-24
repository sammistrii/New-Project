#!/bin/bash

echo "🚀 Eco-Points System - Render Deployment Helper"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Prerequisites Check:"
echo ""

# Check if git is available
if command -v git &> /dev/null; then
    echo "✅ Git is available"
    echo "   Current branch: $(git branch --show-current)"
    echo "   Remote origin: $(git remote get-url origin 2>/dev/null || echo 'Not set')"
else
    echo "❌ Git is not available"
fi

echo ""

echo "🔧 Configuration Files Check:"
echo ""

# Check for required files
required_files=("render.yaml" "Dockerfile.minio" "backend/Dockerfile" "frontend/Dockerfile")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""

echo "📦 Dependencies Check:"
echo ""

# Check if dependencies are installed (workspace setup)
if [ -d "node_modules" ] && [ -f "package.json" ] && grep -q "workspaces" package.json; then
    echo "✅ Dependencies installed (workspace setup)"
    echo "   Backend: ✅"
    echo "   Frontend: ✅"
elif [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    echo "✅ Dependencies installed (separate setup)"
    echo "   Backend: ✅"
    echo "   Frontend: ✅"
else
    echo "❌ Dependencies not installed"
    echo "   Run: npm install (from root directory)"
fi

echo ""

echo "🚀 Deployment Steps:"
echo ""

echo "1. 📝 Update your .env.production file with your actual credentials:"
echo "   - Payment gateway keys (Stripe, PayPal)"
echo "   - Email service credentials"
echo "   - Any other service-specific keys"
echo ""

echo "2. 🔗 Go to [render.com](https://render.com) and:"
echo "   - Sign up/login to your account"
echo "   - Click 'New +' and select 'Blueprint'"
echo "   - Connect your GitHub account"
echo "   - Select this repository"
echo ""

echo "3. ⚙️ Render will automatically:"
echo "   - Detect the render.yaml configuration"
echo "   - Create all required services"
echo "   - Set up environment variables"
echo "   - Deploy your application"
echo ""

echo "4. 🔍 After deployment, verify:"
echo "   - Backend health: https://eco-points-backend.onrender.com/health"
echo "   - API docs: https://eco-points-backend.onrender.com/api/docs"
echo "   - Frontend: https://eco-points-frontend.onrender.com"
echo "   - MinIO console: https://eco-points-minio.onrender.com:9001"
echo ""

echo "5. 🗄️ Initialize the database:"
echo "   - Connect to your PostgreSQL service in Render"
echo "   - Run the init.sql script from backend/database/init.sql"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""

echo "🎯 Ready to deploy? Your system is fully configured for Render!"
echo ""
echo "💡 Pro tip: Use the free tier to test everything before upgrading."