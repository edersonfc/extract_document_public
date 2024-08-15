function PegarAlturaDoNavegador(): any {
    try { return document.documentElement.clientHeight } catch (error) { return 0; }
}

function PegarLarguraDoNavegador(): any {
    try { return document.documentElement.clientWidth } catch (error) { return 0; }
}

export { PegarAlturaDoNavegador, PegarLarguraDoNavegador };