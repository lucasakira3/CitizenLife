/**
 * Botões de página (Anterior · 1 2 3 · Próxima) para listas longas.
 * Com uma página só, não mostra nada.
 */
export default function Paginacao({ pagina, totalPaginas, aoMudar, rotulo = "Páginas" }) {
  if (totalPaginas <= 1) {
    return null;
  }
  const numeros = Array.from({ length: totalPaginas }, (_, indice) => indice + 1);

  return (
    <nav className="paginacao" aria-label={rotulo}>
      <button type="button" className="paginacao__passo" onClick={() => aoMudar(pagina - 1)} disabled={pagina === 1}>
        ‹ Anterior
      </button>
      <ol className="paginacao__numeros">
        {numeros.map((numero) => (
          <li key={numero}>
            <button
              type="button"
              className="paginacao__numero"
              aria-current={numero === pagina ? "page" : undefined}
              aria-label={`Página ${numero} de ${totalPaginas}`}
              onClick={() => aoMudar(numero)}
            >
              {numero}
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="paginacao__passo"
        onClick={() => aoMudar(pagina + 1)}
        disabled={pagina === totalPaginas}
      >
        Próxima ›
      </button>
    </nav>
  );
}
