(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{174:function(e,t,a){"use strict";a.r(t),a.d(t,"query",function(){return o});a(16);var n=a(0),r=a.n(n),i=a(473),c=a(196);t.default=function(e){return r.a.createElement(c.a,Object.assign({backgroundImgSrc:Object(c.b)(e.data)},e),r.a.createElement(i.a,{as:"h2",textAlign:"center"},"Page ",r.a.createElement("code",null,e.location.pathname)," not found..."))};var o="264069677"},188:function(e,t,a){var n;e.exports=(n=a(194))&&n.default||n},193:function(e){e.exports={data:{site:{siteMetadata:{pages:[{name:"poltak.github.io",href:"/",icon:"home",header:!0},{name:"Curriculum Vitae",href:"/cv",icon:"book",header:null},{name:"Blog Posts",href:"/blog",icon:"bullhorn",header:null},{name:"Contact",href:"/contact",icon:"phone",header:null}]}}}}},194:function(e,t,a){"use strict";a.r(t);a(16);var n=a(0),r=a.n(n),i=a(12),c=a.n(i),o=a(84),s=function(e){var t=e.location,a=e.pageResources;return a?r.a.createElement(o.a,Object.assign({location:t,pageResources:a},a.json)):null};s.propTypes={location:c.a.shape({pathname:c.a.string.isRequired}).isRequired},t.default=s},195:function(e){e.exports={data:{site:{siteMetadata:{url:"https://poltak.github.io",twitter:"poltak_",ogImgPath:"/favicon.ico"}}}}},196:function(e,t,a){"use strict";a(199);var n=a(208),r=a.n(n),i=(a(29),a(24),a(18),a(9),a(60),a(203),a(209)),c=a.n(i),o=a(7),s=a.n(o),l=(a(210),a(0)),u=a.n(l),m=a(12),p=a.n(m),d=a(211),h=a.n(d),f=a(469),g=(a(16),a(122)),E=a.n(g),v=a(468),y=a(212),b=a.n(y),x=function(e){var t=e.children,a=E()(e,["children"]);return u.a.createElement("footer",Object.assign({className:b.a.footer},a),u.a.createElement(v.a,null),u.a.createElement(f.a,{className:b.a.footerText,text:!0,textAlign:"right"},u.a.createElement("p",null,t)))},w=a(218),k=a.n(w),q=a(473),T=a(219),R=a.n(T),S=function(e){var t=e.children,a=e.subText,n=e.imgSrc,r=E()(e,["children","subText","imgSrc"]);return u.a.createElement("header",Object.assign({className:R.a.container},r),u.a.createElement(k.a,{className:R.a.img,fixed:n}),u.a.createElement(q.a,{as:"h1",className:R.a.headerText},t),a&&u.a.createElement(u.a.Fragment,null,u.a.createElement(q.a,{as:"h2",className:R.a.subText},a)))},j=a(471),C=a(193),N=(a(35),a(182)),I=a.n(N),O=a(57),A=(a(188),u.a.createContext({}));function P(e){var t=e.staticQueryData,a=e.data,n=e.query,r=e.render,i=a?a.data:t[n]&&t[n].data;return u.a.createElement(u.a.Fragment,null,i&&r(i),!i&&u.a.createElement("div",null,"Loading (StaticQuery)"))}var M=function(e){var t=e.data,a=e.query,n=e.render,r=e.children;return u.a.createElement(A.Consumer,null,function(e){return u.a.createElement(P,{data:t,query:a,render:n||r,staticQueryData:e})})};M.propTypes={data:p.a.object,query:p.a.string.isRequired,render:p.a.func,children:p.a.func};var D=a(260),F=function(e){function t(){for(var t,a=arguments.length,n=new Array(a),r=0;r<a;r++)n[r]=arguments[r];return(t=e.call.apply(e,[this].concat(n))||this).handleClick=function(e){return Object(O.navigate)(t.props.href)},t}return s()(t,e),t.prototype.render=function(){return u.a.createElement(j.a.Item,{onClick:this.handleClick,name:this.props.name,header:this.props.header,active:this.isActive},u.a.createElement(D.a,{name:this.props.icon})," ",this.props.name)},I()(t,[{key:"isActive",get:function(){return this.props.location.pathname===this.props.href}}]),t}(u.a.PureComponent);F.propTypes={name:p.a.string.isRequired,href:p.a.string.isRequired,icon:p.a.string.isRequired,location:p.a.any.isRequired,header:p.a.bool};var L=F,H=a(221),Q=a.n(H),Y=function(e){var t=C.data.site.siteMetadata.pages;return u.a.createElement(j.a,{pointing:!0,secondary:!0,stackable:!0,fluid:!0,widths:t.length,className:Q.a.nav},t.map(function(t,a){return u.a.createElement(L,Object.assign({key:a},e,t))}))},B=a(195),J=a(222),_=function(e){var t=e.pathname,a=e.title;return u.a.createElement(M,{query:"2359324934",render:function(e){var n=e.site.siteMetadata,r=n.url,i=n.twitter,c=n.ogImgPath;return u.a.createElement(J.Helmet,{defaultTitle:a,titleTemplate:"%s | "+a},u.a.createElement("html",{lang:"en"}),u.a.createElement("link",{rel:"canonical",href:""+r+t}),u.a.createElement("meta",{name:"docsearch:version",content:"2.0"}),u.a.createElement("meta",{name:"viewport",content:"width=device-width,initial-scale=1,shrink-to-fit=no,viewport-fit=cover"}),u.a.createElement("meta",{property:"og:url",content:r}),u.a.createElement("meta",{property:"og:type",content:"website"}),u.a.createElement("meta",{property:"og:locale",content:"en"}),u.a.createElement("meta",{property:"og:site_name",content:a}),u.a.createElement("meta",{property:"og:image",content:""+r+c}),u.a.createElement("meta",{property:"og:image:width",content:"512"}),u.a.createElement("meta",{property:"og:image:height",content:"512"}),u.a.createElement("meta",{name:"twitter:card",content:"summary"}),u.a.createElement("meta",{name:"twitter:site",content:i}))},data:B})},V=a(223),z=a.n(V);a.d(t,"b",function(){return K});var G=function(e){function t(){for(var t,a=arguments.length,n=new Array(a),r=0;r<a;r++)n[r]=arguments[r];return(t=e.call.apply(e,[this].concat(n))||this).state={scriptsLoaded:!1,scriptsError:null},t}s()(t,e);var a=t.prototype;return a.componentDidMount=function(){var e=c()(r.a.mark(function e(){var t;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.props.extScripts.map(function(e){return h()(e,{inBody:!0})}),e.prev=1,e.next=4,Promise.all(t);case 4:this.setState(function(e){return{scriptsLoaded:!0}}),e.next=10;break;case 7:e.prev=7,e.t0=e.catch(1),this.setState(function(t){return{scriptsLoaded:!0,scriptsError:e.t0}});case 10:case"end":return e.stop()}},e,this,[[1,7]])}));return function(){return e.apply(this,arguments)}}(),a.render=function(){return u.a.createElement(u.a.Fragment,null,u.a.createElement(_,{pathname:this.props.location.pathname,title:this.props.title}),u.a.createElement("div",{className:z.a.main},u.a.createElement("div",{className:z.a.container},u.a.createElement(Y,this.props),u.a.createElement(S,{subText:this.props.subHeaderText,imgSrc:this.props.backgroundImgSrc},this.props.headerText),u.a.createElement(f.a,{className:z.a.contentContainer,text:!0,textAlign:"justified"},this.props.children)),u.a.createElement(x,null,"I hope you enjoyed my website!")))},t}(u.a.Component);G.propTypes={backgroundImgSrc:p.a.object.isRequired,title:p.a.string.isRequired,headerText:p.a.string.isRequired,subHeaderText:p.a.string.isRequired,calcYear:p.a.func,extScripts:p.a.arrayOf(p.a.string)},G.defaultProps={calcYear:function(){return(new Date).getFullYear()},extScripts:[]};t.a=G;var K=function(e){return e.file.childImageSharp.fixed}}}]);
//# sourceMappingURL=component---src-pages-404-js-2f2ac1da3289d9cf4b2b.js.map