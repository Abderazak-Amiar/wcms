// src/utils.ts
export const getCurrentTrimester = () => {
    const month = new Date().getMonth() + 1; // JavaScript months are 0-based
    if (month >= 1 && month <= 3) return "Jan - Mar";
    if (month >= 4 && month <= 6) return "Apr - Jun";
    if (month >= 7 && month <= 9) return "Jul - Sep";
    return "Oct - Dec";
  };

  export const getCurrentTrimesterFr = () => {
    const month = new Date().getMonth() + 1; // JavaScript months are 0-based
    if (month >= 1 && month <= 3) return "Janvier-Mars";
    if (month >= 4 && month <= 6) return "Avril-Juin";
    if (month >= 7 && month <= 9) return "Juillet-Septembre";
    return "Octobre-Décembre";
  };
  