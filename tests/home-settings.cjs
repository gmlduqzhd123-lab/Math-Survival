// Regression suites deliberately reveal the existing controls through the UI.
module.exports=async page=>{
 for(const id of ['homeSettings','homeExtras','homeCollection']){
  const panel=page.locator('#'+id);
  if(await panel.count()&&!await panel.evaluate(el=>el.open))await panel.locator(':scope > summary').click();
 }
};
