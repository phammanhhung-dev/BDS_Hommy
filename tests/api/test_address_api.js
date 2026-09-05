const addressController = require('../../server/controllers/address.controller');

const req = { query: {}, params: {} };
const res = {
  status: function(s) {
    this.statusCode = s;
    return this;
  },
  json: function(data) {
    console.log(`[Status ${this.statusCode}]`, JSON.stringify(data, null, 2));
    return data;
  }
};

async function test() {
  console.log("--- GET PROVINCES ---");
  const provinces = await addressController.getProvinces(req, res);
  
  if (provinces.success && provinces.data.length > 0) {
    const hanoi = provinces.data.find(p => p.TenKhuVuc === 'Thành phố Hà Nội');
    if (hanoi) {
      console.log(`Found Hanoi with ID: ${hanoi.KhuVucID}`);
      console.log("--- GET DISTRICTS FOR HANOI ---");
      req.params.provinceId = hanoi.KhuVucID;
      const districts = await addressController.getDistricts(req, res);
      
      if (districts.success && districts.data.length > 0) {
        const baDinh = districts.data.find(d => d.TenKhuVuc === 'Quận Ba Đình');
        if (baDinh) {
          console.log(`Found Ba Dinh with ID: ${baDinh.KhuVucID}`);
          console.log("--- GET WARDS FOR BA DINH ---");
          req.params.districtId = baDinh.KhuVucID;
          await addressController.getWards(req, res);
        }
      }
    }
  }
  process.exit(0);
}

test();
