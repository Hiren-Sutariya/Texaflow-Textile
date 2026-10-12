import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("RENDER") is not None or os.environ.get("ENVIRONMENT") == "production"
    print(f"🚀 Starting TexaFlow Textile ERP FastAPI Backend on port {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)

