// import { Button } from '@mui/material';
// import { addDoc, arrayUnion, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
// import { useEffect, useState } from 'react';
// import { database } from '../firebase';

export function DataBasePage() {
  return <div>DataBasePage</div>;
}
//   const [docID, setDocID] = useState('');
//   const [docContent, setDocContent] = useState([]);

//   // Creates a new document in the database
//   async function makeDoc() {
//     const docRef = await addDoc(collection(database, 'items'), {
//       numberArray: [1, 2, 3]
//     });
//     setDocID(docRef.id);
//   }

//   // Updates an existing document with a new number
//   async function addToDoc() {
//     const docRef = doc(database, 'items', docID); // Targets the most recently created doc
//     const newNum = docContent.length + 1;
//     await updateDoc(docRef, { numberArray: arrayUnion(newNum) }); // arrayUnion guarantees an atomic operation to an array
//   }

//   // Initializes a database document on page load/refresh
//   useEffect(() => {
//     makeDoc();
//   }, []);

//   // Watches for updates in the most recently made document
//   useEffect(() => {
//     if (docID) {
//       // onSnapshot watches for changes to the specified document (in this case the specified docID in items)
//       // then runs the callback upon every change
//       const unsub = onSnapshot(doc(database, 'items', docID), (doc) => {
//         setDocContent(doc.data()?.numberArray);
//       });
//       return unsub; // Unsubcribes the snapshot from the page when the page is destroyed
//     }
//   }, [docID]);

//   return (
//     <div>
//       <Button variant="contained" onClick={addToDoc}>
//         Add
//       </Button>
//       {docContent}
//     </div>
//   );
// }
