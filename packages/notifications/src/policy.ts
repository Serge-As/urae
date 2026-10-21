/** Pure notification policy, shared by the owner and browser projections. No delivery or business mutation. */
export interface QuietPreference { quietHours?:{start:string;end:string;timezone?:string};snoozedUntil?:string; }
export function notificationIsQuiet(preference:QuietPreference,at=new Date(),timezone='Africa/Douala'){
  if(preference.snoozedUntil&&Date.parse(preference.snoozedUntil)>at.getTime())return true;
  const quiet=preference.quietHours;if(!quiet||quiet.start===quiet.end)return false;
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:quiet.timezone??timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);
  return quiet.start<quiet.end?clock>=quiet.start&&clock<quiet.end:clock>=quiet.start||clock<quiet.end;
}
