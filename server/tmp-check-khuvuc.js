const KhuVuc = require('./models/khuVucModel');

(async () => {
  try {
    const [provinces] = await KhuVuc.getChildren(null);
    console.log('provinces count', provinces.length);
    const provinceId = provinces[0]?.KhuVucID;
    if (!provinceId) return;
    const [communes] = await KhuVuc.getChildren(provinceId);
    console.log('provinceId', provinceId, 'communes count', communes.length);
    console.log(communes.slice(0, 10));
  } catch (error) {
    console.error(error);
  }
})();
