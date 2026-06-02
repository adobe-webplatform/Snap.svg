document.addEventListener('DOMContentLoaded', async () => {
    const menu = document.getElementById('menu');
    const content = document.getElementById('content');
    let tutorials;

    try {
        const response = await fetch('tutorials.json');
        tutorials = await response.json();
    } catch (error) {
        console.error('Error fetching tutorials:', error);
        content.innerHTML = '<p>Error loading tutorials. Please run the build script.</p>';
        return;
    }

    function renderMenu() {
        let menuHTML = '';
        for (const category in tutorials) {
            menuHTML += `<h3>${category}</h3>`;
            menuHTML += '<ul>';
            tutorials[category].forEach(tutorial => {
                menuHTML += `<li><a href="#" data-path="${tutorial.path}">${tutorial.title}</a></li>`;
            });
            menuHTML += '</ul>';
        }
        menu.innerHTML = menuHTML;
    }

    /**
     * Load and render local demo files in an encapsulated way
     * Uses Shadow DOM to prevent CSS/JS conflicts between demos
     */
    async function loadLocalDemos() {
        const demoDivs = document.querySelectorAll('.local-demo');

        for (const demoDiv of demoDivs) {
            const htmlFile = demoDiv.dataset.html;
            const jsFile = demoDiv.dataset.js;
            const cssFile = demoDiv.dataset.css;

            if (!htmlFile && !jsFile) {
                console.warn('Demo has no HTML or JS file specified:', demoDiv);
                continue;
            }

            try {
                // Fetch all files
                const [htmlContent, jsContent, cssContent] = await Promise.all([
                    htmlFile ? fetch(htmlFile).then(r => r.text()) : Promise.resolve(''),
                    jsFile ? fetch(jsFile).then(r => r.text()) : Promise.resolve(''),
                    cssFile && cssFile !== 'null' ? fetch(cssFile).then(r => r.text()) : Promise.resolve('')
                ]);

                // Create shadow DOM for encapsulation
                const shadow = demoDiv.attachShadow({ mode: 'open' });

                // Create container div
                const container = document.createElement('div');
                container.className = 'demo-container';

                // Add CSS if available
                if (cssContent) {
                    const style = document.createElement('style');
                    style.textContent = cssContent;
                    shadow.appendChild(style);
                }

                // Add demo-specific styles
                const demoStyle = document.createElement('style');
                demoStyle.textContent = `
                    .demo-container {
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        padding: 10px;
                        margin: 20px 0;
                        background: #f9f9f9;
                    }
                    svg {
                        display: block;
                        margin: 0 auto;
                    }
                `;
                shadow.appendChild(demoStyle);

                // Add HTML content
                container.innerHTML = htmlContent;
                shadow.appendChild(container);

                // Load Snap.svg library in shadow DOM context
                // const snapScript = document.createElement('script');
                // snapScript.src = '../../dist/snap.svg.js';
                // snapScript.onload = () => {
                    // Execute the demo JS after Snap is loaded
                    // Use Snap.setDocument() to work with shadow DOM

                    // Create a unique ID for this shadow root instance
                    const shadowId = '_snapShadowRoot_' + Math.random().toString(36).substr(2, 9);

                    // Store shadow root reference temporarily in window
                    window[shadowId] = shadow;

                    const demoScript = document.createElement('script');
                    demoScript.textContent = `
                        (function() {
                            // Retrieve the shadow root from the temporary window storage
                            const shadowRoot = window['${shadowId}'];
                            
                            // Clean up the temporary reference
                            delete window['${shadowId}'];
                            
                            if (!shadowRoot) {
                                console.error('Shadow root not found');
                                return;
                            }
                            
                            // Tell Snap to use the shadow root as its document context
                            window.Snap.setDocument(shadowRoot);
                            window.Snap.setDocument(shadowRoot, true);
                            
                            // Execute the demo code
                            ${jsContent}
                            
                            // Restore regular document context after demo
                            window.Snap.setDocument(document, true);
                        })();
                    `;
                    shadow.appendChild(demoScript);
                // };
                // shadow.appendChild(snapScript);

            } catch (error) {
                console.error('Error loading demo:', demoDiv.id, error);
                demoDiv.innerHTML = `<p style="color: red;">Error loading demo: ${error.message}</p>`;
            }
        }
    }

    async function loadTutorial(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let text = await response.text();

            const md = window.markdownit({
                highlight: function (str, lang) {
                    if (lang) {
                        try {
                            return hljs.highlight(str, {language: lang}).value;
                        } catch (e) {
                            console.error('Highlight error for', lang, ':', e);
                        }
                    }
                    return '';
                }
            });

            // Render markdown
            let html = md.render(text);

            // Replace codepen tags BEFORE setting innerHTML
            // Support both URL format and file-based format
            html = html.replace(/{% codepen (.*?) %}/g, (match, attrs) => {
                // Decode HTML entities (markdown-it escapes quotes as &quot;)
                const decodedAttrs = attrs
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');

                // Check if this is a URL (old format) or file attributes (new format)
                if (decodedAttrs.startsWith('http')) {
                    // Old format: URL
                    const embedUrl = decodedAttrs.replace('/pen/', '/embed/');
                    return `<iframe class="codepen" scrolling="no" src="${embedUrl}" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`;
                } else {
                    // New format: file attributes
                    // Parse attributes like: html="demos/basic-attr.html" js="js/basic-attr.js" css="css/tutorial2.css"
                    const htmlMatch = decodedAttrs.match(/html="([^"]+)"/);
                    const jsMatch = decodedAttrs.match(/js="([^"]+)"/);
                    const cssMatch = decodedAttrs.match(/css="([^"]+)"/);

                    const htmlFile = htmlMatch ? htmlMatch[1] : null;
                    const jsFile = jsMatch ? jsMatch[1] : null;
                    const cssFile = cssMatch ? cssMatch[1] : null;

                    // Create a placeholder div with data attributes
                    // We'll load and render these after setting innerHTML
                    const demoId = 'demo-' + Math.random().toString(36).substr(2, 9);
                    return `<div class="local-demo" id="${demoId}" data-html="${htmlFile || ''}" data-js="${jsFile || ''}" data-css="${cssFile || ''}"></div>`;
                }
            });

            // Set the content
            content.innerHTML = html;

            // Now load and render all local demos
            await loadLocalDemos();

            // Add hljs class to all pre elements
            document.querySelectorAll('#content pre code').forEach((block) => {
                block.parentElement.classList.add('hljs');
            });

            const urlRegex = /(https?:\/\/[^\s<]+)/g;
            const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);

            let nodes = [];
            let node;
            while (node = walker.nextNode()) {
                nodes.push(node);
            }

            nodes.forEach(node => {
                if (node.parentElement.tagName === 'A') {
                    return;
                }

                const text = node.nodeValue;
                const parts = text.split(urlRegex);

                if (parts.length > 1) {
                    const fragment = document.createDocumentFragment();
                    for (let i = 0; i < parts.length; i++) {
                        if (i % 2 === 0) {
                            if (parts[i]) {
                                fragment.appendChild(document.createTextNode(parts[i]));
                            }
                        } else {
                            const a = document.createElement('a');
                            a.href = parts[i];
                            a.target = '_blank';
                            a.textContent = parts[i];
                            fragment.appendChild(a);
                        }
                    }
                    node.parentNode.replaceChild(fragment, node);
                }
            });


        } catch (error) {
            content.innerHTML = `<p>Error loading tutorial: ${error.message}</p>`;
        }
    }

    menu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const path = e.target.dataset.path;
            loadTutorial(path);
        }
    });

    renderMenu();
    // Load the first tutorial by default
    if (tutorials.Basic.length > 0) {
        loadTutorial(tutorials.Basic[0].path);
    }
});
