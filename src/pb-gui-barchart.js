class pbBarChart extends HTMLElement {
    constructor() {
        super();
        this.shadowDOM = this.attachShadow({ mode: 'open' })
        this.shadowDOM.innerHTML=`
        <style>
                svg{
                    background-color:var(--pb-gui-background);
                    box-shadow: 0 5px 5px rgb(0 0 0 / 8%);
                    height: 100%;
                    width: 100%;
                }
                a line{
                stroke:var(--pb-gui-stroke-primary);
                stroke-width:1%
                }
                
                a:nth-child(odd) line{
                stroke:var(--pb-gui-stroke-secondary);
                stroke-width:1%
                }
                .PopUpGraph{
                box-shadow: 0 5px 15px rgb(0 0 0 / 8%);
                padding:10px;
                background-color: white;}
                
                
        </style>`
        
        
        this.xmlDOM = new Array()
        this._setSVG()
        
        this._configdata()
        
        
    }
    
    async _configdata(){
        var response= await fetch("/exist/rest/db/apps/"+this.getAttribute('config'), {
  headers: {
    'Accept': 'application/json'
  }
}) 
this.config= await response.json()
console.log('json',this.config)
        
    }
    
    _setSVG(){
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.svg.setAttribute('xmlns', "http://www.w3.org/2000/svg")
        
        this.shadowDOM.appendChild(this.svg)
    }
    
    connectedCallback() {
        var TH = this
        this.parentNode.addEventListener("data", function (e) {
            TH._refresh(e.detail)
            
            
        });
    }
    _refresh(liste) {
        
        this.dataList = []
        this.config.forEach(path => {
            var listToDict = {}
            var values = []
           liste.forEach(data => {
               
                values.push(document.evaluate(path['xpath'], data, this._nsResolver, XPathResult.STRING_TYPE, null).stringValue)
            })
            
            
            values = values.filter(function (f) { return f !== '' })
            values.forEach(
                function (v, i) {
                    if (!listToDict[v]) {
                        listToDict[v] = [i];
                    } else { listToDict[v].push(i); }
                });
            var result = []
            Object.keys(listToDict).forEach(data => result.push(
                {
                    "Label": data,
                    "Percent": (listToDict[data].length / values.length) * 100,
                    "Count": listToDict[data].length,
                    "Facet": path['Facet']
                }
            ))
            this.dataList[path['Label']] = result.sort(this._compareValues('Percent'))
        }); 
        console.log(this.dataList)
        
        this._affichage()
    }
    _affichage() {
        var oldNode = this.svg
        this._setSVG()
        var url = document.location.href
        var values = Object.entries(this.dataList)
        var ilist = 0
        values.forEach(entry => {
            var [key, list] = entry
            var incr = 0
            var y = (100 * (ilist + 1)) / (values.length + 1)
            ilist += 1
            var g = document.createElementNS("http://www.w3.org/2000/svg", "g")
            g.setAttribute('id', key)
            this.svg.appendChild(g)
            var texte = document.createElementNS("http://www.w3.org/2000/svg", "text")
            texte.setAttribute('x', 0.5 + '%')
            texte.setAttribute('y', (y - 5) + '%')
            texte.innerHTML = key
            g.appendChild(texte)
            list.forEach((data, idata) => {
                var a = document.createElementNS("http://www.w3.org/2000/svg", "a")
                if (typeof (data['Facet']) != "undefined") {
                    //console.log(typeof (url), url)
                    if (url.includes('?')) {
                        a.setAttribute('href', url + "&" + data['Facet'] + "=" + data['Label'])
                    }
                    else {
                        a.setAttribute('href', url + "?" + data['Facet'] + "=" + data['Label'])
                    }
                }
                g.appendChild(a)
                var divInfo = document.createElement("div")
                divInfo.style.display = 'none'
                divInfo.style.position = "absolute"
                divInfo.className = "PopUpGraph"
                this.shadowDOM.appendChild(divInfo)
                var line = document.createElementNS("http://www.w3.org/2000/svg", "line")
                line.setAttribute('x1', incr + '%')
                line.setAttribute('y1', y + '%')
                line.setAttribute('x2', incr + data['Percent'] + '%')
                line.setAttribute('y2', y + '%')
                line.setAttribute('id', data['Label'])
                line.addEventListener("mouseover", function (event) {
                    divInfo.style.display = 'block'
                    line.setAttribute('style', 'stroke:var(--pb-gui-stroke-hover);')
                });
                line.addEventListener("mousemove", function (event) {
                    divInfo.innerHTML = data['Label'] + "</br>" + data['Percent'] + '%' + "</br>" + data['Count'] + " nb"
                    divInfo.style.left = (event.clientX + 15) + "px"
                    divInfo.style.top = (event.clientY + 15) + "px"
                });
                line.addEventListener("mouseleave", function (event) {
                    divInfo.style.display = 'none'
                    line.setAttribute('style', '')
                });
                a.appendChild(line)
                incr += data['Percent']
            }
            )
        }
        )
        this.shadowDOM.replaceChild(this.svg, oldNode)
    }
    _nsResolver(prefix) {
        var ns = {
            'tei': 'http://www.tei-c.org/ns/1.0',
            'mathml': 'http://www.w3.org/1998/Math/MathML'
        };
        return ns[prefix] || null;
    }
    _compareValues(key, order = 'asc') {

        return function innerSort(a, b) {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                return 0;
            }
            const varA = (typeof a[key] === 'string')
                ? a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string')
                ? b[key].toUpperCase() : b[key];
            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return (
                (order === 'desc') ? (comparison * -1) : comparison
            );
        };
    }
}
customElements.define('pb-gui-bar-chart', pbBarChart)