export const URL = " https://rational-killdeer-thoroughly.ngrok-free.app/api"


const truncateMiddle = (str: string, maxLength: number = 16): string => {
    if (str.length <= maxLength) return str;
    
    const ellipsis = '...';
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    
    return str.substr(0, frontChars) + ellipsis + str.substr(str.length - backChars);
}

const formatFloatString = (floatString: string): string => {
    // Convert the string to a number
    const numberValue = parseFloat(floatString);
  
    // Check if the conversion was successful
    if (isNaN(numberValue)) {
      throw new Error('Invalid float string');
    }
  
    // Format the number to two decimal places
    return numberValue.toFixed(2);
  }

export default {truncateMiddle, formatFloatString};

