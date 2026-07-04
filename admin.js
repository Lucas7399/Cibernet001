// ==========================================================
// CIBERNET — painel administrativo
// ==========================================================
// ATENÇÃO: isso é uma proteção simples, só do lado do navegador.
// Qualquer pessoa que souber ler o código-fonte consegue ver a senha.
// Pra proteção de verdade (recomendado antes de usar em produção),
// isso precisa de um login validado por um servidor/backend.
// Troque a senha abaixo por uma sua:
const SENHA_ADMIN = 'cibernet@2026';

const LS_CLIENTES = 'cibernet_clientes';
const LS_CHAMADOS = 'cibernet_chamados';

// ---------- login ----------
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const formLogin = document.getElementById('formLogin');
const loginMsg = document.getElementById('loginMsg');

function estaLogado() {
  return sessionStorage.getItem('cibernet_admin_auth') === 'ok';
}

function mostrarPainel() {
  loginScreen.hidden = true;
  dashboard.hidden = false;
  renderClientes();
  renderChamados();
}

if (estaLogado()) mostrarPainel();

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const senha = document.getElementById('senhaAdmin').value;
  if (senha === SENHA_ADMIN) {
    sessionStorage.setItem('cibernet_admin_auth', 'ok');
    loginMsg.textContent = '';
    mostrarPainel();
  } else {
    loginMsg.textContent = 'Senha incorreta. Tente novamente.';
  }
});

document.getElementById('btnSair').addEventListener('click', () => {
  sessionStorage.removeItem('cibernet_admin_auth');
  dashboard.hidden = true;
  loginScreen.hidden = false;
  formLogin.reset();
});

// ---------- abas ----------
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tab.dataset.tab === 'clientes' ? 'painelClientes' : 'painelChamados').classList.add('active');
  });
});

// ---------- helpers de armazenamento ----------
function getClientes() {
  return JSON.parse(localStorage.getItem(LS_CLIENTES) || '[]');
}
function setClientes(lista) {
  localStorage.setItem(LS_CLIENTES, JSON.stringify(lista));
}
function getChamados() {
  return JSON.parse(localStorage.getItem(LS_CHAMADOS) || '[]');
}
function setChamados(lista) {
  localStorage.setItem(LS_CHAMADOS, JSON.stringify(lista));
}
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

// ---------- CLIENTES ----------
const tbodyClientes = document.getElementById('tbodyClientes');
const clientesVazio = document.getElementById('clientesVazio');
const buscaCliente = document.getElementById('buscaCliente');

function renderClientes() {
  const termo = buscaCliente.value.trim().toLowerCase();
  const lista = getClientes().filter(c =>
    !termo ||
    (c.nome || '').toLowerCase().includes(termo) ||
    (c.cpfCnpj || '').toLowerCase().includes(termo) ||
    (c.telefone || '').toLowerCase().includes(termo) ||
    (c.celular || '').toLowerCase().includes(termo)
  );

  tbodyClientes.innerHTML = lista.map(c => `
    <tr>
      <td>${escapeHtml(c.nome)}</td>
      <td>${escapeHtml(c.cpfCnpj)}</td>
      <td>${escapeHtml(c.telefone || c.celular || '—')}</td>
      <td>${escapeHtml(c.endereco || '—')}</td>
      <td>${escapeHtml(c.plano || '—')}</td>
      <td>${escapeHtml(c.ip || '—')}</td>
      <td><span class="tag-origem ${c.origem === 'site' ? 'site' : 'manual'}">${c.origem === 'site' ? 'Site' : 'Manual'}</span></td>
      <td class="row-actions">
        <button data-editar="${c.id}">Editar</button>
        <button data-excluir="${c.id}" class="btn-excluir">Excluir</button>
      </td>
    </tr>
  `).join('');

  clientesVazio.classList.toggle('show', lista.length === 0);
}

buscaCliente.addEventListener('input', renderClientes);

tbodyClientes.addEventListener('click', (e) => {
  const idEditar = e.target.dataset.editar;
  const idExcluir = e.target.dataset.excluir;
  if (idEditar) abrirModalCliente(idEditar);
  if (idExcluir) {
    if (confirm('Excluir este cliente?')) {
      setClientes(getClientes().filter(c => c.id !== idExcluir));
      renderClientes();
    }
  }
});

// modal de cliente
const modalCliente = document.getElementById('modalCliente');
const formCliente = document.getElementById('formCliente');
const modalTitulo = document.getElementById('modalTitulo');

document.getElementById('btnNovoCliente').addEventListener('click', () => abrirModalCliente(null));
document.getElementById('btnCancelarModal').addEventListener('click', fecharModalCliente);

function abrirModalCliente(id) {
  formCliente.reset();
  document.getElementById('clienteId').value = id || '';

  if (id) {
    const cliente = getClientes().find(c => c.id === id);
    modalTitulo.textContent = 'Editar cliente';
    document.getElementById('clNome').value = cliente.nome || '';
    document.getElementById('clCpf').value = cliente.cpfCnpj || '';
    document.getElementById('clTelefone').value = cliente.telefone || cliente.celular || '';
    document.getElementById('clEndereco').value = cliente.endereco || '';
    document.getElementById('clIp').value = cliente.ip || '';
  } else {
    modalTitulo.textContent = 'Adicionar cliente';
  }
  modalCliente.hidden = false;
}
function fecharModalCliente() {
  modalCliente.hidden = true;
}

formCliente.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('clienteId').value;
  const lista = getClientes();

  const dadosForm = {
    nome: document.getElementById('clNome').value.trim(),
    cpfCnpj: document.getElementById('clCpf').value.trim(),
    telefone: document.getElementById('clTelefone').value.trim(),
    endereco: document.getElementById('clEndereco').value.trim(),
    ip: document.getElementById('clIp').value.trim() || 'não informado'
  };

  if (id) {
    const idx = lista.findIndex(c => c.id === id);
    if (idx > -1) lista[idx] = { ...lista[idx], ...dadosForm };
  } else {
    lista.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      ...dadosForm,
      origem: 'manual',
      status: 'ativo',
      criadoEm: new Date().toISOString()
    });
  }

  setClientes(lista);
  fecharModalCliente();
  renderClientes();
});

// ---------- CHAMADOS ----------
const tbodyChamados = document.getElementById('tbodyChamados');
const chamadosVazio = document.getElementById('chamadosVazio');
const buscaChamado = document.getElementById('buscaChamado');

function renderChamados() {
  const termo = buscaChamado.value.trim().toLowerCase();
  const lista = getChamados()
    .slice()
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .filter(c =>
      !termo ||
      (c.nome || '').toLowerCase().includes(termo) ||
      (c.cpf || '').toLowerCase().includes(termo) ||
      (c.protocolo || '').toLowerCase().includes(termo)
    );

  tbodyChamados.innerHTML = lista.map(c => `
    <tr>
      <td>${escapeHtml(c.protocolo)}</td>
      <td>${escapeHtml(c.nome)}</td>
      <td>${escapeHtml(c.cpf)}</td>
      <td>${escapeHtml(c.telefone)}</td>
      <td>${escapeHtml(c.endereco)}</td>
      <td>${escapeHtml(c.motivo)}</td>
      <td>
        <select class="status-select" data-status="${c.id}">
          <option value="Aberto" ${c.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
          <option value="Em andamento" ${c.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
          <option value="Resolvido" ${c.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
        </select>
      </td>
      <td class="row-actions">
        <button data-excluir-chamado="${c.id}" class="btn-excluir">Excluir</button>
      </td>
    </tr>
  `).join('');

  chamadosVazio.classList.toggle('show', lista.length === 0);
}

buscaChamado.addEventListener('input', renderChamados);

tbodyChamados.addEventListener('change', (e) => {
  const id = e.target.dataset.status;
  if (!id) return;
  const lista = getChamados();
  const idx = lista.findIndex(c => c.id === id);
  if (idx > -1) {
    lista[idx].status = e.target.value;
    setChamados(lista);
  }
});

tbodyChamados.addEventListener('click', (e) => {
  const id = e.target.dataset.excluirChamado;
  if (id && confirm('Excluir este chamado?')) {
    setChamados(getChamados().filter(c => c.id !== id));
    renderChamados();
  }
});