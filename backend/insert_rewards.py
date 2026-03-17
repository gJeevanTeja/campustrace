with open(r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\frontend\src\pages\Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

rewards_section = '''
           {/* Rewards Section */}
           <PremiumCard className="p-8 space-y-6" hover={false}>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Trophy size={18} className="text-amber-500" /> Rewards &amp; Achievements
              </h3>
              <div className="space-y-4">
                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Reward Points</span>
                       <span className="text-2xl font-black text-amber-600">{p.reward_points || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Level</span>
                       <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">{p.level || 'Beginner Helper'}</span>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-1">
                          <span>Progress to next level</span>
                       </div>
                       <div className="w-full bg-amber-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round(((p.reward_points || 0) % 300) / 3))}%` }} />
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-primary">{p.successful_returns || 0}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Items Returned</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-amber-600">{(p.badges || []).length}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Badges</p>
                    </div>
                 </div>
                 {(p.badges || []).length > 0 ? (
                    <div>
                       <p className="text-[10px] font-black uppercase text-text-secondary mb-3 tracking-widest">Your Badges</p>
                       <div className="flex flex-wrap gap-2">
                          {(p.badges || []).map((badge, i) => (
                             <span key={i} className="text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl">{badge}</span>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-4">
                       <p className="text-xs font-bold text-text-secondary">Return items to earn badges!</p>
                    </div>
                 )}
              </div>
           </PremiumCard>
'''

# Find the last </PremiumCard> before </div>\n      </div>
old = '            </PremiumCard>\n         </div>\n      </div>'
new = '            </PremiumCard>\n' + rewards_section + '\n         </div>\n      </div>'

if old in content:
    content = content.replace(old, new, 1)
    with open(r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\frontend\src\pages\Profile.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Success!')
else:
    print('Pattern not found. Trying CRLF variant...')
    old2 = '            </PremiumCard>\r\n         </div>\r\n      </div>'
    new2 = '            </PremiumCard>\r\n' + rewards_section + '\r\n         </div>\r\n      </div>'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        with open(r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\frontend\src\pages\Profile.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Success (CRLF)!')
    else:
        print('STILL NOT FOUND')
        # Show 10 chars around the expected position
        idx = content.find('</PremiumCard>')
        while idx != -1:
            snippet = content[max(0,idx-5):idx+60]
            print(repr(snippet))
            idx = content.find('</PremiumCard>', idx+1)
