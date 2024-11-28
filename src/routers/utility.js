const RESOURCE = {
    users: "users",
    tasks: "tasks"
}

const PATCH_OPTIONS = { 
    new: true, 
    runValidators: true
}

const validateRequestOperation = (requestBody, resource ) => {
    const operations = Object.keys(requestBody);
    const allowedOperations = resource === "users".toLowerCase() 
        ? ['name', 'email', 'password', 'age'] 
        : ['description', 'completed'];

    return operations.every( operation => allowedOperations.includes(operation) );
}

module.exports = { RESOURCE, PATCH_OPTIONS, validateRequestOperation }