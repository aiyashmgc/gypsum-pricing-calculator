'use client';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatRs } from '@/lib/format';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utility ceil
const ceil = (n: number) => Math.ceil(n || 0);
const createEmptyArea = () => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'Gypsum Ceiling',
  subtype: 'Slab',
  area: 0,
  additionalCost: 0,
  margin: 15,
});

export default function Home() {
  const [siteName, setSiteName] = useLocalStorage('siteName', '');
  const [materialUnitPrices, setMaterialUnitPrices] = useLocalStorage('materialUnitPrices', {
    gypsumBoard: 0,
    giChannel: 0,
    puttyPack: 0,
    gypsumScrews: 0,
    hiltyScrews: 0,
    wallPlugs: 0,
  });
  const [variableCosts, setVariableCosts] = useLocalStorage('variableCosts', {
    lChannel: { quantity: 0, unitPrice: 0 },
    filler: { quantity: 0, unitPrice: 0 },
    jointTape: { quantity: 0, unitPrice: 0 },
    gypsumGum: { quantity: 0, unitPrice: 0 },
  });
  const [labourRates, setLabourRates] = useLocalStorage('labourRates', { gypsum: 120, putty: 65 });
  const [projectExpenses, setProjectExpenses] = useLocalStorage('projectExpenses', {
    transportCost: 0,
    transportTimes: 0,
    dailyAmount: 0,
    days: 0,
    otherCosts: 0,
  });
  const [areas, setAreas] = useLocalStorage('areas', [createEmptyArea()]);

  const totalProjectArea = useMemo(
    () => areas.reduce((sum: number, a: any) => sum + Number(a.area || 0), 0),
    [areas]
  );

  const totalCommonCosts = useMemo(() => {
    const transportTotal = Number(projectExpenses.transportCost || 0) * Number(projectExpenses.transportTimes || 0);
    const dailyTotal = Number(projectExpenses.dailyAmount || 0) * Number(projectExpenses.days || 0);
    const other = Number(projectExpenses.otherCosts || 0);
    const variableSum = Object.values(variableCosts).reduce((acc: number, item: any) => {
      return acc + Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }, 0);
    return transportTotal + dailyTotal + other + variableSum;
  }, [projectExpenses, variableCosts]);

  const areaWeightages = useMemo(() => {
    if (totalProjectArea === 0) return {} as Record<string, number>;
    return areas.reduce((map: any, area: any) => {
      map[area.id] = Number(area.area || 0) / totalProjectArea;
      return map;
    }, {} as Record<string, number>);
  }, [areas, totalProjectArea]);

  const areaSummaries = useMemo(() => {
    return areas.map((area: any) => {
      const weight = areaWeightages[area.id] || 0;
      let gypsumLabourRate = Number(labourRates.gypsum || 0);
      let puttyLabourRate = Number(labourRates.putty || 0);
      if (area.type === 'Gypsum Partition' && area.subtype === 'Double-sided') {
        gypsumLabourRate *= 1.5;
        puttyLabourRate *= 2;
      }
      const baseGiForArea = (Number(area.area || 0) / 32) * 8;
      const adjustedGiForArea =
        area.type === 'Gypsum Ceiling' && area.subtype === 'High Roof'
          ? baseGiForArea * 1.5
          : baseGiForArea;
      const giChannelQtyArea = ceil(adjustedGiForArea);
      const gypsumBoardQty = ceil(Number(area.area || 0) / 32);
      const puttyPackQty = ceil(Number(area.area || 0) / 80);
      const gypsumScrewBoxes = ceil((gypsumBoardQty * 50) / 1000);
      const hiltyKg = ceil(gypsumBoardQty / 30);
      const wallPlugsQty = hiltyKg;
      const rivetScrewsBoxes = ceil((giChannelQtyArea / 1000) * 5);

      const mat = materialUnitPrices as any;
      const costGypsumBoard = gypsumBoardQty * Number(mat.gypsumBoard || 0);
      const costGiChannel = giChannelQtyArea * Number(mat.giChannel || 0);
      const costPuttyPack = puttyPackQty * Number(mat.puttyPack || 0);
      const costGypsumScrews = gypsumScrewBoxes * Number(mat.gypsumScrews || 0);
      const costHilty = hiltyKg * Number(mat.hiltyScrews || 0);
      const costWallPlugs = wallPlugsQty * Number(mat.wallPlugs || 0);

      const labourGypsum = gypsumLabourRate * Number(area.area || 0);
      const labourPutty = puttyLabourRate * Number(area.area || 0);
      const allocatedCommon = totalCommonCosts * weight;
      const additional = Number(area.additionalCost || 0);
      const totalCostForArea =
        costGypsumBoard +
        costGiChannel +
        costPuttyPack +
        costGypsumScrews +
        costHilty +
        costWallPlugs +
        labourGypsum +
        labourPutty +
        allocatedCommon +
        additional;
      const marginPct = Number(area.margin || 0);
      const priceRaw = totalCostForArea * (1 + marginPct / 100);
      const priceRounded = Math.round(priceRaw / 5) * 5;
      const pricePerSqft = area.area ? priceRounded / Number(area.area) : 0;
      const profit = priceRounded - totalCostForArea;

      return {
        ...area,
        computed: {
          material: {
            gypsumBoardQty,
            giChannelQty: giChannelQtyArea,
            puttyPackQty,
            gypsumScrewBoxes,
            hiltyKg,
            wallPlugsQty,
            rivetScrewsBoxes,
          },
          costs: {
            costGypsumBoard,
            costGiChannel,
            costPuttyPack,
            costGypsumScrews,
            costHilty,
            costWallPlugs,
            labourGypsum,
            labourPutty,
            allocatedCommon,
            additional,
            totalCostForArea,
            priceRaw,
            priceRounded,
            pricePerSqft,
            profit,
          },
        },
      };
    });
  }, [areas, areaWeightages, materialUnitPrices, labourRates, totalCommonCosts]);

  const grandTotals = useMemo(() => {
    const totalArea = totalProjectArea;
    const totalCost = areaSummaries.reduce((acc: number, a: any) => acc + a.computed.costs.totalCostForArea, 0);
    const totalPrice = areaSummaries.reduce((acc: number, a: any) => acc + a.computed.costs.priceRounded, 0);
    const totalProfit = areaSummaries.reduce((acc: number, a: any) => acc + a.computed.costs.profit, 0);
    return { totalArea, totalCost, totalPrice, totalProfit };
  }, [areaSummaries, totalProjectArea]);

  const updateArea = (id: string, patch: any) => {
    setAreas((prev: any) => prev.map((a: any) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const addArea = () => setAreas((prev: any) => [...prev, createEmptyArea()]);
  const removeArea = (id: string) => setAreas((prev: any) => prev.filter((a: any) => a.id !== id));

  const exportPDF = async () => {
    const el = document.getElementById('app-root');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${siteName || 'gypsum_project'}_quote.pdf`);
  };
  const exportImage = async () => {
    const el = document.getElementById('app-root');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${siteName || 'gypsum_project'}_quote.png`;
    link.click();
  };

  return (
    <div id="app-root" className="min-h-screen p-4 bg-slate-50 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" placeholder="Enter project/site name" value={siteName} onChange={(e: any) => setSiteName(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF}>Export PDF</Button>
          <Button onClick={exportImage}>Export Image</Button>
        </div>
      </header>
      {/* Simplified: Only showing core inputs and one area for brevity; extend as in spec */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Material Prices</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <div>
              <Label>Gypsum Board</Label>
              <Input type="number" value={(materialUnitPrices as any).gypsumBoard} onChange={(e: any) => setMaterialUnitPrices((m: any) => ({ ...m, gypsumBoard: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>GI Channel</Label>
              <Input type="number" value={(materialUnitPrices as any).giChannel} onChange={(e: any) => setMaterialUnitPrices((m: any) => ({ ...m, giChannel: Number(e.target.value) }))} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Areas</h2>
          <Button onClick={addArea}>Add Another Area</Button>
        </div>
        {areas.map((area: any) => (
          <Card key={area.id}>
            <CardHeader>
              <div className="flex justify-between w-full">
                <CardTitle>{area.name || 'Unnamed'}</CardTitle>
                <Button onClick={() => removeArea(area.id)}>Remove</Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={area.name} onChange={(e: any) => updateArea(area.id, { name: e.target.value })} />
              </div>
              <div>
                <Label>Area (SqFt)</Label>
                <Input type="number" value={area.area} onChange={(e: any) => updateArea(area.id, { area: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Margin (%)</Label>
                <Input type="number" value={area.margin} onChange={(e: any) => updateArea(area.id, { margin: Number(e.target.value) })} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Summary */}
      <div className="p-4 bg-white rounded shadow">
        <p>
          <strong>Total Project Area:</strong> {totalProjectArea} SqFt
        </p>
        <p>
          <strong>Total Price:</strong> {formatRs(grandTotals.totalPrice)}
        </p>
        <p>
          <strong>Total Profit:</strong> {formatRs(grandTotals.totalProfit)}
        </p>
      </div>
    </div>
  );
}
