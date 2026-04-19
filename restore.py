import urllib.request
# Write the original imports back
imports = """import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

"""
c = open('app.js').read()
if 'initializeApp' not in c:
    open('app.js','w').write(imports + c)
    print('Fixed')
else:
    print('Already has imports - checking firebaseConfig...')
    print('initializeApp found at:', c.index('initializeApp'))
