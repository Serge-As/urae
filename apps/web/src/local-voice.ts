/** On-device speech is opt-in. The browser owns its language pack, never Eco's outbox. */
export async function localVoiceAvailability(lang:string):Promise<string>{
  const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!Recognition?.available||!Recognition?.install)return'unsupported';
  try{return await Recognition.available({langs:[lang],processLocally:true});}catch{return'unsupported';}
}
export async function installLocalVoice(lang:string):Promise<boolean>{
  const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!Recognition?.install)throw Error('LOCAL_VOICE_UNSUPPORTED');
  const result=await Recognition.install({langs:[lang],processLocally:true});
  if(!result)throw Error('LOCAL_VOICE_INSTALL_FAILED');return true;
}
