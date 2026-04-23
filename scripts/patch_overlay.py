with open('/workspaces/Letsgrow/index.html', 'r') as f:
    html = f.read()

overlay = '''<script>
(function(){
var l=[],o=document.createElement("div");
o.style.cssText="position:fixed;bottom:0;left:0;right:0;max-height:50vh;overflow-y:auto;background:rgba(0,0,0,.9);color:#0f0;font:12px monospace;padding:8px;z-index:99999;display:none";
var b=document.createElement("button");
b.textContent="X Close";
b.style.cssText="background:red;color:white;border:none;padding:4px 8px;cursor:pointer;display:block;margin-bottom:4px";
b.onclick=function(){o.style.display="none"};
o.appendChild(b);
var d=document.createElement("div");
o.appendChild(d);
document.addEventListener("DOMContentLoaded",function(){document.body.appendChild(o)});
function s(t,a){
  var m=a.map(function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ");
  l.push("["+t+"] "+m);
  d.innerHTML=l.map(function(x){return"<div>"+x.replace(/</g,"&lt;")+"</div>"}).join("");
  o.style.display="block";
}
["log","warn","error"].forEach(function(t){
  var g=console[t].bind(console);
  console[t]=function(){s(t.toUpperCase(),[].slice.call(arguments));g.apply(console,arguments)};
});
window.addEventListener("unhandledrejection",function(e){s("PROMISE",[e.reason&&e.reason.message||String(e.reason)])});
window.addEventListener("error",function(e){s("ERROR",[e.message,"line:"+e.lineno])});
})();
</script>'''

html = html.replace('<body>', '<body>' + overlay, 1)

with open('/workspaces/Letsgrow/index.html', 'w') as f:
    f.write(html)

print("Done - overlay injected")
