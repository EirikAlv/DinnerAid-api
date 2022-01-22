const axios = require('axios')

module.exports = {

    SaveItem: async function(item){
        let projectId = await GetProjectId("Groceries");
        let section = await GetSection(item.section, projectId);

        axios.post('https://api.todoist.com/rest/v1/tasks', 
        {
            "content": item.norwegian, 
            "project_id": projectId,
            "section_id": section
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TOKEN}`
            }
        }).then((response) => {
        }, (error) => {
            console.log(error);
        });

    }
};

async function GetProjectId(Name){
    const res = await axios.get('https://api.todoist.com/rest/v1/projects', {
        headers: {
            'Authorization': `Bearer ${process.env.TOKEN}`
        }
    });
    return res.data.find(l => l.name === Name).id;
}

async function GetSection(sectionName, projectId){
    const res = await axios.get(`https://api.todoist.com/rest/v1/sections?project_id=${projectId}`, {
        headers: {
            'Authorization': `Bearer ${process.env.TOKEN}`
        }
    });
    return res.data.find(s => s.name === sectionName)?.id;
}