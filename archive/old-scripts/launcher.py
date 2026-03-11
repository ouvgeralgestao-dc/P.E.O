import os
import subprocess
import webbrowser
import time
import sys

# 1. GARANTIR DIRETÓRIO CORRETO (EVITA ERRO SYSTEM32)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

def run_install(folder_name):
    print(f"--- Instalando dependências em: {folder_name} ---")
    target_dir = os.path.join(BASE_DIR, folder_name)
    # shell=True para reconhecer 'npm' no Windows
    subprocess.check_call("npm install", shell=True, cwd=target_dir)

def launch_server(folder_name, command, title):
    print(f"--- Iniciando {title} ---")
    target_dir = os.path.join(BASE_DIR, folder_name)
    
    # Executa em uma NOVA JANELA (cmd.exe) para não travar o script principal
    # e para você ver os logs de erro se houverem.
    subprocess.Popen(
        f'start "{title}" cmd /k "{command}"', 
        shell=True, 
        cwd=target_dir
    )

def main():
    print("=== EXECUTOR SIMPLES P.E.O ===")
    
    try:
        # 1. Instalar dependências (Sequencial - espera terminar)
        run_install("backend")
        run_install("frontend")
        
        # 2. Iniciar Servidores (Paralelo - janelas separadas)
        launch_server("backend", "npm run dev", "SERVIDOR BACKEND (Porta 6001)")
        launch_server("frontend", "npm run dev", "SERVIDOR FRONTEND (Porta 6002)")
        
        # 3. Abrir Navegador
        print("--- Aguardando 10 segundos para iniciar o sistema ---")
        time.sleep(10)
        
        url = "http://localhost:6002"
        print(f"--- Abrindo {url} ---")
        webbrowser.open(url)
        
        print("\nSUCESSO!")
        print("Duas janelas pretas foram abertas com os servidores.")
        print("Não feche elas enquanto estiver usando o sistema.")
        
    except Exception as e:
        print(f"\nERRO: {e}")
        input("Pressione Enter para sair...")

if __name__ == "__main__":
    main()
