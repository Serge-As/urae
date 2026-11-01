export async function shareStatementImage(kind,data){
 if(!['MEMBER_SHEET','SESSION_SHEET'].includes(kind))throw Error('STATEMENT_IMAGE_SCOPE_REQUIRED');
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1000;const c=canvas.getContext('2d');if(!c)throw Error('CANVAS_UNAVAILABLE');
 c.fillStyle='#f6f8f3';c.fillRect(0,0,1080,1000);c.fillStyle='#164f3d';c.fillRect(0,0,1080,166);c.fillStyle='#e6c35f';c.font='bold 30px system-ui';c.fillText('ECO-SYSTEM · EXTRAIT DE FICHE',48,60);c.fillStyle='#fff';c.font='bold 36px system-ui';c.fillText(String(data.group?.name??'Groupe').slice(0,45),48,118);
 c.fillStyle='#164f3d';c.font='bold 30px system-ui';c.fillText(String(kind==='MEMBER_SHEET'?data.member.displayName:data.meeting.title).slice(0,48),48,225);
 const rows=kind==='MEMBER_SHEET'?data.byRubric.map(r=>[r.rubricName,r.total]):data.rubrics.map((r,i)=>[r.name,data.columnTotals[i]]);
 c.font='24px system-ui';for(const [i,row]of rows.slice(0,11).entries()){const y=285+i*43;c.fillStyle=i%2?'#fff':'#e7eee8';c.fillRect(40,y-28,1000,42);c.fillStyle='#153a30';c.fillText(String(row[0]).slice(0,45),52,y);c.textAlign='right';c.fillText(new Intl.NumberFormat('fr-CM').format(Number(row[1]))+' XAF',1020,y);c.textAlign='left';}
 c.fillStyle='#164f3d';c.font='bold 28px system-ui';c.fillText('Flux affichés : '+new Intl.NumberFormat('fr-CM').format(Number(kind==='MEMBER_SHEET'?data.totalNet:data.grandTotal))+' XAF',48,815);
 c.font='19px system-ui';for(const [i,line]of ['Réf. '+data.lot,'Généré le '+new Date(data.generatedAt).toLocaleString('fr-CM'),'Copie de lecture · ce visuel ne certifie pas un paiement.',rows.length>11?'11 rubriques visibles / '+rows.length+' · détail dans Eco ou Excel.':'Vérifiez la version et la confirmation dans Eco.'].entries())c.fillText(line,48,865+i*30);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG_UNAVAILABLE');const file=new File([blob],'Eco-'+data.lot+'.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Eco-System · extrait de fiche'});return;}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
