/* Toudy Style & Co - integração com Supabase.
   Carregue DEPOIS do <script> principal do index.html. */
(() => {
  const sb = window.supabase.createClient(
    'https://hiqxdnhhifffuqmmmdhx.supabase.co',
    'sb_publishable_9VPghy4yscJjUXC-CMag5Q_Ov9lMiwq' // chave pública: segura no front-end (o RLS protege os dados)
  );

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // nome da categoria no banco -> chave usada pelo showCat() do site
  const CAT = { camisetas: 'camisetas', calcas: 'calcas', moletons: 'moletoms', polos: 'polos' };
  const TIPO = { camisetas: 'camiseta', calcas: 'calca', moletoms: 'moletom', polos: 'polo' };
  const byId = {};

  /* ---------- CATÁLOGO ---------- */
  const soon = p => `<div class="product-card"><div class="product-card-img" style="background:#222;opacity:.5">
    <span style="font-family:'Bebas Neue',sans-serif;font-size:24px">EM BREVE</span></div>
    <div class="product-card-info"><span class="product-name">${esc(p.nome)}</span><span class="product-price">Em breve</span></div></div>`;

  const card = p => p.em_breve ? soon(p) : `<div class="product-card" data-id="${p.id}">
    <div class="product-card-img"><img src="${esc(p.imagem_url)}" alt="${esc(p.nome)}"
      onerror="this.style.display='none'; this.parentElement.classList.add('image-error')"></div>
    <div class="product-card-info"><span class="product-name">${esc(p.nome)}</span>
    <span class="product-price">${money(Number(p.preco))}</span></div></div>`;

  async function loadCatalog() {
    const { data, error } = await sb.from('produtos')
      .select('id,nome,preco,imagem_url,em_breve,categorias(nome),produto_tamanhos(tamanho,estoque)').order('id');
    if (error) return console.error('Catálogo:', error.message); // mantém o HTML estático como reserva
    const groups = {};
    data.forEach(p => {
      byId[p.id] = p;
      const k = CAT[norm(p.categorias?.nome || '')];
      if (k) (groups[k] ??= []).push(p);
    });
    Object.entries(groups).forEach(([k, list]) => {
      const grid = document.querySelector(`#cat-${k} .products-grid`);
      if (!grid) return;
      grid.innerHTML = list.map(card).join('');
      grid.querySelectorAll('.product-card[data-id]').forEach(el => {
        const p = byId[el.dataset.id];
        el.onclick = () => openProduct(TIPO[k], p.nome, Number(p.preco), p.imagem_url, p.id);
      });
    });
  }

  // openProduct agora guarda o id do produto e desativa tamanhos sem estoque
  const _open = window.openProduct;
  window.openProduct = (type, name, price, image, id) => {
    _open(type, name, price, image);
    currentProduct.id = id;
    const sizes = byId[id]?.produto_tamanhos || [];
    document.querySelectorAll('.size-option').forEach(b => {
      const t = sizes.find(s => s.tamanho === b.textContent);
      b.disabled = !!id && (!t || t.estoque <= 0);
      b.style.opacity = b.disabled ? .35 : 1;
    });
  };

  /* ---------- NEWSLETTER ---------- */
  window.subscribeNewsletter = async () => {
    const inp = document.getElementById('nl-input'), btn = inp.nextElementSibling, email = inp.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      inp.style.borderColor = '#ff4040'; setTimeout(() => inp.style.borderColor = '', 2000); return;
    }
    const { error } = await sb.from('inscritos_newsletter').insert({ email });
    if (error && error.code !== '23505') return alert('Não foi possível inscrever agora. Tente novamente.');
    inp.value = ''; btn.textContent = 'INSCRITO ✓'; btn.style.background = '#1a6e3a';
    setTimeout(() => { btn.textContent = 'QUERO RECEBER'; btn.style.background = ''; }, 3000);
  };

  /* ---------- LOGIN + CHECKOUT ---------- */
  document.head.insertAdjacentHTML('beforeend', `<style>
    .tm h2{font-family:'Bebas Neue',sans-serif;font-size:38px;margin-bottom:16px}
    .tm input,.tm select{width:100%;padding:12px;margin:0 0 10px;background:#222;border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:6px;font:inherit}
    .tm .msg{color:#ff8080;font-size:13px;min-height:18px;margin-bottom:8px}
    .tm .alt{margin-top:14px;font-size:14px;color:#7a7a7a;cursor:pointer;text-decoration:underline}
    .tm .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}</style>`);

  const closeModal = () => document.getElementById('toudy-modal')?.remove();
  function modal(html) {
    closeModal();
    const o = document.createElement('div');
    o.id = 'toudy-modal'; o.className = 'product-overlay active'; o.style.zIndex = 3000;
    o.innerHTML = `<div class="product-modal tm" style="width:min(460px,92vw)">${html}</div>`;
    o.addEventListener('click', e => { if (e.target === o) closeModal(); });
    document.body.appendChild(o);
    return o;
  }
  const val = (id) => document.getElementById(id).value.trim();
  const say = m => document.getElementById('t-msg').textContent = m;

  function authModal(register = false) {
    modal(`<h2>${register ? 'CRIAR CONTA.' : 'ENTRAR.'}</h2>
      ${register ? '<input id="a-nome" placeholder="Nome completo">' : ''}
      <input id="a-email" type="email" placeholder="E-mail">
      <input id="a-senha" type="password" placeholder="Senha (mín. 6 caracteres)">
      <div class="msg" id="t-msg"></div>
      <button class="add-cart-btn" id="a-go">${register ? 'CADASTRAR' : 'ENTRAR'}</button>
      <p class="alt" id="a-alt">${register ? 'Já tenho conta' : 'Criar conta'}</p>`);
    document.getElementById('a-alt').onclick = () => authModal(!register);
    document.getElementById('a-go').onclick = async () => {
      const email = val('a-email'), password = val('a-senha');
      if (!email || password.length < 6) return say('Informe e-mail e senha (mín. 6 caracteres).');
      if (register) {
        const nome = val('a-nome');
        if (!nome) return say('Informe seu nome.');
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nome } } });
        if (error) return say(error.message);
        if (!data.session) return say('Conta criada! Confirme seu e-mail e depois entre.');
        return checkoutForm(data.user);
      }
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return say('E-mail ou senha incorretos.');
      checkoutForm(data.user);
    };
  }

  function checkoutForm(user) {
    modal(`<h2>ENTREGA.</h2>
      <div class="row"><input id="e-cep" placeholder="CEP"><input id="e-estado" placeholder="Estado (UF)"></div>
      <input id="e-cidade" placeholder="Cidade"><input id="e-bairro" placeholder="Bairro"><input id="e-rua" placeholder="Rua">
      <div class="row"><input id="e-numero" placeholder="Número"><input id="e-comp" placeholder="Complemento"></div>
      <select id="e-pag"><option value="pix">PIX</option><option value="cartao_credito">Cartão de crédito</option>
      <option value="cartao_debito">Cartão de débito</option></select>
      <div class="msg" id="t-msg"></div>
      <button class="add-cart-btn" id="e-go">CONFIRMAR PEDIDO</button>`);
    document.getElementById('e-go').onclick = async () => {
      const f = { cep: val('e-cep'), estado: val('e-estado'), cidade: val('e-cidade'), bairro: val('e-bairro'), rua: val('e-rua'), numero: val('e-numero') };
      if (Object.values(f).some(v => !v)) return say('Preencha todos os campos obrigatórios.');
      const itens = cart.map(i => ({ produto_id: i.id, tamanho: i.size, quantidade: i.quantity }));
      if (itens.some(i => !i.produto_id)) return say('Carrinho desatualizado. Esvazie e adicione as peças de novo.');
      const btn = document.getElementById('e-go'); btn.disabled = true;
      const { data: end, error: e1 } = await sb.from('enderecos')
        .insert({ usuario_id: user.id, ...f, complemento: val('e-comp') || null }).select('id').single();
      if (e1) { btn.disabled = false; return say(e1.message); }
      const { data: pedidoId, error: e2 } = await sb.rpc('criar_pedido',
        { p_endereco_id: end.id, p_forma_pagamento: val('e-pag'), p_itens: itens });
      if (e2) { btn.disabled = false; return say(e2.message); }
      cart.length = 0; saveCart(); renderCart(); closeModal(); closeCart();
      alert(`Pedido #${pedidoId} criado com sucesso!`);
      loadCatalog(); // atualiza o estoque exibido
    };
  }

  window.checkout = async () => {
    if (!cart.length) return;
    const { data: { session } } = await sb.auth.getSession();
    session ? checkoutForm(session.user) : authModal();
  };

  loadCatalog();
})();
