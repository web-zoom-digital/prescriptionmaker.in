import fs from 'fs';
const file = 'apps/web/src/lib/pdf/prescription-document.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace standard single-line elements
content = content.replace(/\{doctor\.clinicName && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.clinicName ? <Text$1>$2</Text> : null}');
content = content.replace(/\{doctor\.phone && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.phone ? <Text$1>$2</Text> : null}');
content = content.replace(/\{doctor\.address && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.address ? <Text$1>$2</Text> : null}');
content = content.replace(/\{doctor\.registrationNumber && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.registrationNumber ? <Text$1>$2</Text> : null}');
content = content.replace(/\{doctor\.qualifications && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.qualifications ? <Text$1>$2</Text> : null}');
content = content.replace(/\{doctor\.specialization && <Text([^>]+)>([^<]+)<\/Text>\}/g, '{doctor.specialization ? <Text$1>$2</Text> : null}');

// For the Image and Box and med elements, we can do it via a more precise string replace:
content = content.replace(
  '{doctor.logoUrl && (\n                <Image src={doctor.logoUrl} style={{ width: 40, height: 40, objectFit: \'contain\', borderRadius: 20, backgroundColor: \'#fff\', padding: 2, marginRight: 12 }} />\n              )}',
  '{doctor.logoUrl ? (\n                <Image src={doctor.logoUrl} style={{ width: 40, height: 40, objectFit: \'contain\', borderRadius: 20, backgroundColor: \'#fff\', padding: 2, marginRight: 12 }} />\n              ) : null}'
);

content = content.replace(
  '{med.strength && (\n                    <View style={{ backgroundColor: \'#e2e8f0\', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>\n                      <Text style={{ fontSize: 10, color: \'#64748b\' }}>{med.strength}</Text>\n                    </View>\n                  )}',
  '{med.strength ? (\n                    <View style={{ backgroundColor: \'#e2e8f0\', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>\n                      <Text style={{ fontSize: 10, color: \'#64748b\' }}>{med.strength}</Text>\n                    </View>\n                  ) : null}'
);

content = content.replace(
  '{med.form && (\n                    <View style={{ backgroundColor: `${ac}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>\n                      <Text style={{ fontSize: 10, color: ac }}>{med.form}</Text>\n                    </View>\n                  )}',
  '{med.form ? (\n                    <View style={{ backgroundColor: `${ac}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>\n                      <Text style={{ fontSize: 10, color: ac }}>{med.form}</Text>\n                    </View>\n                  ) : null}'
);

fs.writeFileSync(file, content);
