
const lute = Lute.New();

function buildCatalog(){
    let contentNodes = document.getElementById("post").childNodes;
    let titleTagNameList = ["H1","H2","H3","H4","H5","H6"];
    let titleNodes = [];
    contentNodes.forEach(function (value, key, parent) {
        let titleLevel = titleTagNameList.indexOf(value.tagName);
        if (titleLevel === -1) return;
        titleNodes.push(value);
    })

    function build(nodes) {
        let ulNode = document.createElement("ul")
        let maxTitleLevel = 6;
        for (let i = 0; i<nodes.length; i++){
            let titleLevel = titleTagNameList.indexOf(nodes[i].tagName);
            maxTitleLevel = Math.min(maxTitleLevel, titleLevel);
        }
        for (let i = 0; i<nodes.length; i++){
            let titleLevel = titleTagNameList.indexOf(nodes[i].tagName);
            if (titleLevel === maxTitleLevel){
                let item = document.createElement("li");
                item.innerText = nodes[i].innerText;
                item.setAttribute("nodeIndex",i.toString());
                item.addEventListener("click",function (event) {
                    let t = nodes[Number(item.getAttribute("nodeIndex"))];
                    t.scrollIntoView();
                    t.style.animation = "hover-title 1s ease"
                    t.addEventListener("animationend",function () {
                        this.style.animation = "none";
                    })
                    event.stopPropagation()
                })
                let subNodes = [];
                for (let j = i+1; j<nodes.length; j++){
                    let subTitleLevel = titleTagNameList.indexOf(nodes[j].tagName);
                    if (subTitleLevel > titleLevel){
                        subNodes.push(nodes[j]);
                        i++;
                    }else {
                        break;
                    }
                }

                if (subNodes.length > 0){
                    item.append(build(subNodes))
                }
                ulNode.append(item);
            }
        }
        return ulNode;
    }
    if (titleNodes.length <= 3){
        document.getElementsByClassName("catalog")[0].remove();
        document.getElementsByClassName("content")[0].style.marginLeft="0";
    }else {
        document.getElementsByClassName("catalog")[0].append(build(titleNodes));
    }
}

function loadPost(markdownURL) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', markdownURL, true);
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            let md = httpRequest.responseText;
            let postDiv = document.getElementById("post");
            postDiv.innerHTML = lute.MarkdownStr("", md);
            let postHead = postDiv.getElementsByTagName("blockquote")[0];
            let head = JSON.parse(postHead.getElementsByTagName("p")[0].innerHTML.replaceAll("<br>",""));
            postHead.remove();
            document.title = head.title;
            document.getElementById("post-title").innerText = head.title;
            document.getElementById("post-time").innerText = head.datetime;
            hljs.highlightAll();
            buildCatalog();

            let links = postDiv.getElementsByTagName("a");
            for (let link of links){
                link.addEventListener("click",function (event){
                    window.open(link.href)
                    event.preventDefault();
                });
            }
        }
    };
}
window.onload = function () {
    let url = document.location.href;
    let hash = url.substring(url.lastIndexOf("#") + 1, url.length);
    loadPost("../posts/" + hash);
}