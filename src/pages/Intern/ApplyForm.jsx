import React,{useState} from 'react'

const ApplyForm = () => {
  const [formData,setFormData]=useState({
    firstName:"",
    middleName:"",
    lastName:"",
    email:"",
    address:"",
    city:"",
    state:"",
    university:"",
    currentYear:"",
    passingYear:"",
    github:"",
    linkedin:"",
    whyInternship:"",
    skills:"",
    expetations:"",
    resume:null,
    coverLetter:null,
  });

  const handleChange=(e)=>{
    const {name,value,files} =e.target;
    if(name==="resume" || name=="coverLetter"){
      setFormData({...formData,[name]:files[0]});
    }
    else{
      setFormData({...formData,[name]:value});
    }
  };

  const handleSubmit=(e)=>{
    e.preventDefault();
    alert('Form Submitted!');
    console.log("Submitted Data:",formData);
  };
  
  return (
    <div className='max-w-6xl mx-auto p-6 md:p-10'>
      <h2 className='text-3xl font-bold mb-6 text-center text-bllue-700'>Internship Application Form</h2>
      <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 shadow-lg rounded-lg'>
        <input name='firstName' value={formData.firstName} onChange={handleChange} placeholder='First Name' required className='input-field'/>

        <input name='middleName' value={formData.middleName} onChange={handleChange} placeholder='Middle Name' className='input-field'/>

        <input name='lastName' value={formData.lastName} onChange={handleChange} placeholder='Last Name' required className='input-field'/>

        <input name='email' value={formData.email} onChange={handleChange} placeholder='Email Address' required className='input-field'/>

        <input name='address' value={formData.address} onChange={handleChange} placeholder='Home Address' required className='input-field'/>

        <input name='city' value={formData.city} onChange={handleChange} placeholder='City' required className='input-field'/>

        <input name='state' value={formData.state} onChange={handleChange} placeholder='State' required className='input-field'/>

        <input name='unversity' value={formData.university} onChange={handleChange} placeholder='University' required className='input-field'/>

        <input name='currentYear' value={formData.currentYear} onChange={handleChange} placeholder='Current Year' required className='input-field'/>

        <input name='passingYear' value={formData.passingYear} onChange={handleChange} placeholder='Passng Year' required className='input-field'/>

        <input name='github' value={formData.github} onChange={handleChange} placeholder='GitHub Profile Link' required className='input-field'/>

        <input name='linkedin' value={formData.linkedin} onChange={handleChange} placeholder='Linkedin Profile Link' required className='input-field'/>

        <textarea name='whyInternship' value={formData.whyInternship} onChange={handleChange} placeholder='Why do you want this internship?' rows="3" className='textarea-field md:col-span-2'/>

        <textarea name='skills' value={formData.skills} onChange={handleChange} placeholder='Mention your skills' rows="3" className='textarea-field md:col-span-2'/>

        <textarea name='expectations' value={formData.expetations} onChange={handleChange} placeholder='What do you expect to learn during the internship?' rows="3" className='textarea-field md:col-span-2'/>

        <div className='flex flex-col gap-2'>
          <label className='font-semibold text-gray-700'>Upload Resume(PDF)</label>
          <input type='file' name='resume' accept='.pdf' required onChange={handleChange} className='file-input'/>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='font-semibold text-gray-700'>Upload Cover Letter(PDF)</label>
          <input type='file' name='coverLetter' accept='.pdf' onChange={handleChange} className='file-input'/>
        </div>

        <button type='submit' className='col-span-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition'>Submit Application</button>
      </form>

      <div className='mt-10 bg-gray-100 p-6 rounded-lg shadow-inner'>
        <h3 className='text-xl font-bold mb-4 text-blue-800'>Live Preview</h3>
        <pre className='text-sm overflow-x-auto bg-white p-4 rounded-md shadow max-h-64'>
          {JSON.stringify(
            {
              ...formData,
              resume: formData.resume?.name || null,
              coverLetter:formData.coverLetter?.name || null,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default ApplyForm
