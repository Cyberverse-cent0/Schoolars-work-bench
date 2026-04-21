const bcrypt = require("bcryptjs");

async function testPasswordVerification() {
  try {
    console.log("Testing password verification...");
    
    // Test with a known password
    const testPassword = "test123";
    const hashedPassword = bcrypt.hashSync(testPassword, 10);
    console.log("Generated hash:", hashedPassword);
    
    const isValid = bcrypt.compareSync(testPassword, hashedPassword);
    console.log("Password verification result:", isValid);
    
    // Test with wrong password
    const isInvalid = bcrypt.compareSync("wrongpassword", hashedPassword);
    console.log("Wrong password verification result:", isInvalid);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testPasswordVerification();
