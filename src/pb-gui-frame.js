class pbGuiFrame extends HTMLElement {
    constructor() {
        super();
        this.shadowDOM = this.attachShadow({ mode: 'open' })
              this.shadowDOM.innerHTML=`
        <style>
                select{
                    position: absolute;
                    border: none;
                    border-radius:0px;
                    box-shadow: 0 5px 15px rgb(0 0 0 / 8%);
                }
               
               
                
                
        </style>
        `
        //création de la balise de sélection
        var DOMselect = document.createElement('select')
        //DOMselect.style.display = 'block'
        
        this.shadowDOM.appendChild(DOMselect)
        //Ajout des options en fonction enfants définis dans la balise
        Array.from(this.children).forEach(element => {
            var DOMoption = document.createElement('option')
            DOMoption.innerHTML = element.getAttribute('title')
            DOMselect.appendChild(DOMoption)
            if (element.getAttribute('title') == this.getAttribute('selected')) { element.style.display = 'block' }
            else { element.style.display = 'none' }
            this.shadowDOM.appendChild(element)
        })
        
        this._refresh()
    }
    connectedCallback() {
        //this._refresh()
        //Détection des évenements a chaque nouvelle selection de graph et chaque modification de facet
        var TH = this
        this.shadowDOM.addEventListener("change", function (e) {
            var selected = e.target.options[e.target.options.selectedIndex].text;
            TH.setAttribute('selected', selected)
        });
        facets.addEventListener('pb-custom-form-loaded', function (e) {
            TH._refresh()
            TH._refresh()
        });
    }
    async _getDocumentList() {
        //Récupération de la liste des documents
        const rslt = new Array();
        var url = '/exist/apps/' + document.location.href.split("/")[5] + '/api/search/?' + document.location.href.split("?")[1] + '&start=1&per-page=100000'
        await fetch(url).then(response => response.text()).then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString("<div>" + data.replace("<!DOCTYPE html>", "") + "</div>", "application/xml");
            for (let item of xml.getElementsByTagName('a')) { rslt.push(item.attributes['href'].nodeValue); }
            this.fileList = rslt
        })
        return rslt
    }
    _getDataList(item) {
        return fetch('/exist/rest/db/apps/' + document.location.href.split("/")[5] + '/data/' + item, { cache: "no-store" }).then(response => response.text()).then(data => {
            const parser = new DOMParser();
            const xmlDOM = parser.parseFromString(data, "application/xml");
            this.xmlDOM.push(xmlDOM)
        })
    }
    async _refresh() {
        this.xmlDOM=new Array()
        
        var promiseList = []
        
        
        this.url = document.location.href;
        await this._getDocumentList().then(data => data.forEach(data => promiseList.push(this._getDataList(data))))
        Promise.all(promiseList)
        
   
        this.dispatchEvent(new CustomEvent("data", {
            detail: this.xmlDOM
        }))
        
    }
    static get observedAttributes() { return ['selected'] };
    attributeChangedCallback(name, oldValue, newValue) {
        //A chaque change de valeur changement de valeur
        Array.from(this.shadowDOM.children).forEach(element => {
            if ((element.getAttribute('title') == newValue) || (element.tagName == 'SELECT')) { element.style.display = 'block' }
            else { element.style.display = 'none' }
        })
    }
}
customElements.define('pb-gui-frame', pbGuiFrame)