import { db, auth } from './firebase-config.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
window.LG = {
    members: [],
      contributions: {},
        juniors: [],
          currentUser: null,
            isAdmin: false,
              _listeners: [],

                async init() {
                    console.log('[LG] State initialising...');
                        this._listeners.forEach(unsub => unsub());
                            this._listeners = [];

                                onAuthStateChanged(auth, (user) => {
                                      this.currentUser = user;
                                            document.dispatchEvent(new CustomEvent('lg:auth', { detail: user }));
                                                });
      const unsubMembers = onSnapshot(
              collection(db, 'members'),
                    (snap) => {
                            this.members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                                    console.log('[LG] Members loaded:', this.members.length);
                                            document.dispatchEvent(new Event('lg:members-updated'));
                                                  },
                                                        (err) => console.error('[LG] Members error:', err)
                                                            );
                                                                this._listeners.push(unsubMembers);
                                                                const unsubContribs = onSnapshot(
                                                                        collection(db, 'contributions'),
                                                                              (snap) => {
                                                                                      this.contributions = {};
                                                                                              snap.docs.forEach(d => { this.contributions[d.id] = d.data(); });
                                                                                                      console.log('[LG] Contributions loaded');
                                                                                                              document.dispatchEvent(new Event('lg:contributions-updated'));
                                                                                                                    },
                                                                                                                          (err) => console.error('[LG] Contributions error:', err)
                                                                                                                              );
                                                                                                                                  this._listeners.push(unsubContribs);
                                                                                                                                  const unsubJuniors = onSnapshot(
                                                                                                                                          collection(db, 'juniors'),
                                                                                                                                                (snap) => {
                                                                                                                                                        this.juniors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                                                                                                                                                                console.log('[LG] Juniors loaded:', this.juniors.length);
                                                                                                                                                                        document.dispatchEvent(new Event('lg:juniors-updated'));
                                                                                                                                                                              },
                                                                                                                                                                                    (err) => console.error('[LG] Juniors error:', err)
                                                                                                                                                                                        );
                                                                                                                                                                                            this._listeners.push(unsubJuniors);
                                                                                                                                                                                              }
                                                                                                                                                                                              };

                                                                                                                                                                                              window.LG.init();
                                                                                                                                                                                              
                                                                                                                                  )
                                                                )
      )                                          
}