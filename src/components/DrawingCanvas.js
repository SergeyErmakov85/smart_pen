useEffect(() => {
     // Handle bluetooth stroke data
     if (strokeData.length > 0 && context) {
       strokeData.forEach(data => {
         drawPoint(data.x, data.y, data.pressure);
       });
       clearStrokeData();
     }
  }, [strokeData, context, clearStrokeData, drawPoint]);