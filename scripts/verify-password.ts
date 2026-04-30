import { compare } from "bcryptjs";

async function verify() {
    const password = "admin123";
    const hash = "$2b$10$IFuwkYt.g0mwBeFdgJBv2OdGM5DkRvXf60Hw/6biOXNOQuEJIyYt6"; // from mock_dynamo.json for admin@pinescript.com
    
    const isValid = await compare(password, hash);
    console.log(`Password "${password}" is valid for hash:`, isValid);

    const clientPassword = "client123";
    const clientHash = "$2b$10$X0s4mwAsfyJg.Ldm/R.Y1OXWdQoST3tvpE1GKOjCIAqjGw4Hwbk.6"; // for client@pinescript.com
    const isClientValid = await compare(clientPassword, clientHash);
    console.log(`Password "${clientPassword}" is valid for hash:`, isClientValid);
}

verify();
