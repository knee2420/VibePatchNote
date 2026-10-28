import subprocess

def test_agy_pdf_read():
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(current_dir, "프로젝트 매니저의 5대 필수 관리 문서.pdf")
    prompt = f"다음 PDF 파일의 내용을 정확히 읽고 이해해서 핵심 내용을 요약 출력해줘: {pdf_path}"
    
    print(f"Running agy-cli with prompt: {prompt}")
    
    cmd = ["agy", "-p", prompt, "--dangerously-skip-permissions"]
    
    # Run agy with print mode
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    
    output_path = os.path.join(current_dir, "pdf_output.md")
    error_path = os.path.join(current_dir, "pdf_error.log")

    if result.returncode == 0:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(result.stdout)
        print(f"Success! Output saved to {output_path}")
    else:
        with open(error_path, "w", encoding="utf-8") as f:
            f.write(result.stderr)
        print(f"Error! Error log saved to {error_path}")

if __name__ == "__main__":
    test_agy_pdf_read()
