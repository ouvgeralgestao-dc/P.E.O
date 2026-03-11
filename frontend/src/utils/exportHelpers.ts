/**
 * Utilitário para Exportação de Organogramas
 * Garante centralização e proporção adequada ao tamanho da página
 */

import { PAGE_SIZES } from '../constants/pageSizes';

/**
 * Exporta organograma com centralização e proporção adequada
 * @param {HTMLElement} canvasElement - Elemento do canvas ReactFlow
 * @param {string} tamanhoFolha - Tamanho da folha (A0-A6)
 * @param {string} format - Formato de exportação ('png', 'jpg', 'pdf')
 * @param {number} dpi - DPI para exportação (padrão: 300)
 * @returns {Promise<HTMLCanvasElement>} Canvas processado
 */
export const exportOrganogramaWithLayout = async (canvasElement, tamanhoFolha = 'A3', format = 'png', dpi = 300) => {
    const html2canvas = (await import('html2canvas')).default;

    // Obter dimensões da página selecionada (PADRÃO: RETRATO)
    const pageSize = PAGE_SIZES[tamanhoFolha.toUpperCase()] || PAGE_SIZES.A3;

    // FORÇAR LANDSCAPE (Horizontal) - Inverter largura e altura se estiver em retrato
    // Organogramas são sempre horizontais
    const baseWidth = Math.max(pageSize.width, pageSize.height);
    const baseHeight = Math.min(pageSize.width, pageSize.height);

    // Ajustar para o DPI solicitado
    const pageWidth = baseWidth * (dpi / 300);
    const pageHeight = baseHeight * (dpi / 300);

    // Escala de captura (Aumentar para garantir nitidez das linhas)
    const captureScale = 3;

    // HACK: Engrossar linhas temporariamente para a exportação
    // No PDF, linhas finas somem no redimensionamento. Vamos deixá-las mais robustas.
    // ------------------------------------------------------------------
    // ESTRATÉGIA AVANÇADA DE CAPTURA (DOM-BASED BOUNDING BOX)
    // ------------------------------------------------------------------
    // O html2canvas corta conteúdo que está fora da Viewport visível ou em coordenadas negativas.
    // Para resolver, vamos calcular manualmente a caixa delimitadora (Bounding Box) de TODOS os nós.

    // 1. Encontrar todos os nós renderedizados no DOM
    const nodes = canvasElement.querySelectorAll('.setor-node, .react-flow__node');

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // 2. Iterar e calcular extremos (considerando transformações CSS)
    if (nodes.length > 0) {
        nodes.forEach(node => {
            // O React Flow usa 'transform: translate(x, y)' para posicionar nós
            const style = window.getComputedStyle(node);
            const transform = style.transform;

            // Tentar extrair X/Y da matriz de transformação
            // matrix(1, 0, 0, 1, X, Y)
            if (transform && transform !== 'none') {
                const matrix = transform.match(/^matrix\((.+)\)$/);
                if (matrix) {
                    const values = matrix[1].split(',').map(parseFloat);
                    const x = values[4];
                    const y = values[5];
                    const w = node.offsetWidth;
                    const h = node.offsetHeight;

                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x + w > maxX) maxX = x + w;
                    if (y + h > maxY) maxY = y + h;
                }
            } else {
                // Fallback: usar getBoundingClientRect relativo ao container
                const rect = node.getBoundingClientRect();
                const containerRect = canvasElement.getBoundingClientRect();
                const x = rect.left - containerRect.left;
                const y = rect.top - containerRect.top;

                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x + rect.width > maxX) maxX = x + rect.width;
                if (y + rect.height > maxY) maxY = y + rect.height;
            }
        });
    } else {
        // Fallback se não encontrar nós (improvisado)
        minX = 0; minY = 0;
        maxX = canvasElement.scrollWidth;
        maxY = canvasElement.scrollHeight;
    }

    // 3. Adicionar margem de segurança (padding) ao redor do organograma
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // 4. Calcular dimensões REAIS do conteúdo
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    // Se as dimensões forem inválidas (ex: erro no calculo), fallback:
    const finalCaptureWidth = (totalWidth > 0 && totalWidth < 15000) ? totalWidth : canvasElement.scrollWidth;
    const finalCaptureHeight = (totalHeight > 0 && totalHeight < 15000) ? totalHeight : canvasElement.scrollHeight;

    console.log(`[Export Debug] Bounds: x=${minX}, y=${minY}, w=${finalCaptureWidth}, h=${finalCaptureHeight}`);

    // ESTRATÉGIA DE NORMALIZAÇÃO POSITIVA:
    // Em vez de pedir para o html2canvas capturar coordenadas negativas (que falha com SVGs),
    // vamos mover (translate) TODO o conteúdo para coordenadas positivas (0,0) dentro do clone.
    const offsetX = -minX;
    const offsetY = -minY;

    const originalCanvas = await html2canvas(canvasElement, {
        scale: captureScale,
        backgroundColor: '#ffffff',
        logging: true,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        // Capturar a partir do 0,0 pois moveremos o conteúdo para lá
        x: 0,
        y: 0,
        width: finalCaptureWidth,
        height: finalCaptureHeight,
        windowWidth: finalCaptureWidth,
        windowHeight: finalCaptureHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
            console.log(' Preparing export with Positive Normalization...');

            // 1. Encontrar o viewport que contém tudo
            const viewport = clonedDoc.querySelector('.react-flow__viewport');
            if (viewport) {
                // Forçar a posição do viewport para compensar o deslocamento negativo
                // O React Flow aplica transform: translate(x,y) scale(z). Vamos sobrescrever ou adicionar.
                // Na verdade, o mais seguro é aplicar no container PAI do viewport ou ajustar o próprio viewport.
                // Vamos aplicar um transform no viewport que move tudo para (0,0) visual

                // Nota: O viewport já tem um transform. Se sobrescrevermos, perdemos o zoom/pan original?
                // Sim, mas queremos perder o Pan original e setar o nosso. O Zoom deve ser 1.
                viewport.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;
                viewport.style.transformOrigin = '0 0';
            }

            // 2. Ajustar container principal
            const clonedApp = clonedDoc.querySelector('.react-flow');
            if (clonedApp) {
                clonedApp.style.width = `${finalCaptureWidth}px`;
                clonedApp.style.height = `${finalCaptureHeight}px`;
                clonedApp.style.overflow = 'visible';
                clonedApp.style.position = 'relative';
            }

            // 3. Garantir overflow visible em tudo
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.style) { el.style.overflow = 'visible'; }
            });

            // 4. Ajuste fino nas linhas
            const paths = clonedDoc.querySelectorAll('.react-flow__edge-path, path');
            paths.forEach(path => {
                if (path.closest('.react-flow__edge')) {
                    path.style.strokeWidth = '2px';
                    path.style.stroke = '#555';
                    path.setAttribute('stroke-width', '2');
                    path.setAttribute('stroke', '#555');
                }
            });

            // 5. Z-index
            const edges = clonedDoc.querySelectorAll('.react-flow__edge');
            edges.forEach(edge => {
                edge.style.zIndex = '9999';
            });
            console.log(' Export preparation finished.');
        }
    });

    // Criar novo canvas com dimensões da página (LANDSCAPE)
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = pageWidth;
    finalCanvas.height = pageHeight;
    const ctx = finalCanvas.getContext('2d');

    // Desativar suavização para manter linhas nítidas se possível
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Preencher fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Calcular margem (5% da largura/altura para respiro)
    const marginX = pageWidth * 0.05;
    const marginY = pageHeight * 0.05;

    // Área disponível para o organograma
    const availableWidth = pageWidth - (marginX * 2);
    const availableHeight = pageHeight - (marginY * 2);

    // Calcular escala para "fit" (caber) na página mantendo proporção
    const scaleX = availableWidth / originalCanvas.width;
    const scaleY = availableHeight / originalCanvas.height;
    const finalScale = Math.min(scaleX, scaleY);

    // Dimensões finais do organograma desenhado
    const drawnWidth = originalCanvas.width * finalScale;
    const drawnHeight = originalCanvas.height * finalScale;

    // Calcular posição para centralizar
    const x = (pageWidth - drawnWidth) / 2;
    const y = (pageHeight - drawnHeight) / 2;

    // Desenhar organograma centralizado e proporcional
    // Usar 'imageSmoothingQuality' ajuda a manter as linhas nítidas no downscale
    ctx.drawImage(originalCanvas, x, y, drawnWidth, drawnHeight);

    return finalCanvas;
};

/**
 * Exporta como PNG
 */
export const exportToPNG = async (canvasElement, tamanhoFolha, filename) => {
    const canvas = await exportOrganogramaWithLayout(canvasElement, tamanhoFolha, 'png', 300);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};

/**
 * Exporta como JPG
 */
export const exportToJPG = async (canvasElement, tamanhoFolha, filename) => {
    const canvas = await exportOrganogramaWithLayout(canvasElement, tamanhoFolha, 'jpg', 300);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.95);
    });
};

/**
 * Exporta como PDF
 */
export const exportToPDF = async (canvasElement, tamanhoFolha, filename) => {
    const jsPDF = (await import('jspdf')).default;
    const canvas = await exportOrganogramaWithLayout(canvasElement, tamanhoFolha, 'pdf', 200); // DPI menor para PDF

    // Configurar PDF
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: tamanhoFolha.toLowerCase()
    });

    // Usar PNG para garantir nitidez máxima das linhas e textos (sem artefatos de compressão)
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Adicionar imagem ao PDF (já está centralizada e proporcional)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    return pdf;
};
