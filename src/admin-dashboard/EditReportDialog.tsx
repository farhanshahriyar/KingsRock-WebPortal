// import React, { useState, useEffect } from "react";

// export function EditReportDialog({ report, open, onOpenChange, onSave }) {
//   const [formData, setFormData] = useState({
//     subject: "",
//     description: "",
//     report_type: "",
//     status: "",
//     created_at: "",
//   });

//   useEffect(() => {
//     if (report) {
//       setFormData({
//         subject: report.subject,
//         description: report.description,
//         report_type: report.report_type,
//         status: report.status,
//         created_at: report.created_at,
//       });
//     }
//   }, [report]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSaveChanges = () => {
//     onSave(formData); // Pass updated data to parent
//   };

//   return (
//     <div className={`modal ${open ? 'open' : ''}`}>
//       <div className="modal-content">
//         <h2>Edit Report</h2>
//         <form>
//           <div>
//             <label>Subject</label>
//             <input
//               type="text"
//               name="subject"
//               value={formData.subject}
//               onChange={handleInputChange}
//             />
//           </div>
//           <div>
//             <label>Description</label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//             />
//           </div>
//           <div>
//             <label>Report Type</label>
//             <input
//               type="text"
//               name="report_type"
//               value={formData.report_type}
//               onChange={handleInputChange}
//             />
//           </div>
//           <div>
//             <label>Status</label>
//             <input
//               type="text"
//               name="status"
//               value={formData.status}
//               onChange={handleInputChange}
//             />
//           </div>
//           <button type="button" onClick={handleSaveChanges}>Save Changes</button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";

export function EditReportDialog({ report, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    report_type: "",
    status: "",
    created_at: "",
  });

  useEffect(() => {
    if (report) {
      setFormData({
        subject: report.subject || "",
        description: report.description || "",
        report_type: report.report_type || "",
        status: report.status || "",
        created_at: report.created_at || "",
      });
    }
  }, [report]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    if (report && formData) {
      onSave(formData); // Pass updated data to parent
      onOpenChange(false); // Close the dialog after saving
    }
  };

  return (
    <div className={`modal ${open ? "open" : ""}`}>
      <div className="modal-content">
        <h2>Edit Report</h2>
        <form>
          <div>
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Report Type</label>
            <input
              type="text"
              name="report_type"
              value={formData.report_type}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Status</label>
            <input
              type="text"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Created At</label>
            <input
              type="text"
              name="created_at"
              value={formData.created_at}
              readOnly
            />
          </div>
          <button type="button" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

