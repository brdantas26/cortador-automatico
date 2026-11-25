// Hook PostToolUse (Edit|Write): checa a sintaxe do arquivo editado.
// Sem jq nem linter no projeto, usa so o que o Node e o Python ja trazem.
// Exit 2 devolve o erro pro Claude corrigir na hora.
const { spawnSync } = require('child_process');

let entrada = '';
process.stdin.on('data', (c) => (entrada += c)).on('end', () => {
  let arquivo = '';
  try {
    arquivo = (JSON.parse(entrada).tool_input || {}).file_path || '';
  } catch {
    return;
  }

  let r;
  if (/\.js$/.test(arquivo) && !/lucide\.js$/.test(arquivo)) {
    r = spawnSync('node', ['--check', arquivo], { encoding: 'utf8' });
  } else if (/\.py$/.test(arquivo)) {
    // ast.parse nao cria __pycache__, ao contrario do py_compile
    r = spawnSync('python', ['-c', "import ast,sys;ast.parse(open(sys.argv[1],encoding='utf8').read())", arquivo], { encoding: 'utf8' });
  }

  if (r && r.status) {
    process.stderr.write(`Erro de sintaxe em ${arquivo}:\n${r.stderr}`);
    process.exit(2);
  }
});
