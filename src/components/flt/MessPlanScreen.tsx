import { useState, useEffect } from 'react';
import { 
  Utensils, 
  Plus, 
  Edit3, 
  Trash2, 
  Coffee, 
  Sun, 
  Moon, 
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { MessPlan } from '../../types/flt';

export default function MessPlanScreen() {
  const [plans, setPlans] = useState<MessPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MessPlan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<MessPlan>>({
    planName: '',
    mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
    cuisineCategory: 'KERALA',
    monthlyPrice: 400,
    dailyPrice: 16,
    description: '',
    isActive: true
  });

  const loadPlans = () => {
    const list = dbService.getMessPlans();
    setPlans([...list]);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormData({
      planName: '',
      mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
      cuisineCategory: 'KERALA',
      monthlyPrice: 400,
      dailyPrice: 16,
      description: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: MessPlan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setIsModalOpen(true);
  };

  const toggleMealType = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    const current = formData.mealTypes || [];
    if (current.includes(type)) {
      if (current.length === 1) return; // Keep at least one
      setFormData({ ...formData, mealTypes: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, mealTypes: [...current, type] });
    }
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planName) {
      alert('Plan Name is required.');
      return;
    }

    const planId = editingPlan ? editingPlan.id : `MESS-${Date.now().toString().slice(-4)}`;
    const planToSave: MessPlan = {
      id: planId,
      planName: formData.planName || 'Meal Plan',
      mealTypes: formData.mealTypes || ['LUNCH', 'DINNER'],
      cuisineCategory: (formData.cuisineCategory as any) || 'KERALA',
      monthlyPrice: Number(formData.monthlyPrice) || 350,
      dailyPrice: Number(formData.dailyPrice) || 15,
      description: formData.description || '',
      isActive: formData.isActive !== false
    };

    dbService.saveMessPlan(planToSave);
    loadPlans();
    setIsModalOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    dbService.deleteMessPlan(id);
    setDeleteConfirmId(null);
    loadPlans();
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Food &amp; Mess Package Maintenance Desk (MESS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            ACTIVE PLANS: {plans.filter(p => p.isActive).length}
          </span>
          <button 
            onClick={loadPlans}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex items-center justify-between shadow-2xs">
        <p className="text-xs text-slate-600 font-medium">
          Define meal subscription tiers (3-Meals, 2-Meals, Dinner Only) bundled with room rent.
        </p>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-[#00A2E8] hover:bg-[#0089C7] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer transition-all border border-[#007BB3] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Food Package
        </button>
      </div>

      {/* 3. Cards Grid */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-white border border-[#b0b0b0] rounded shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#00A2E8] transition-all"
            >
              {/* Header */}
              <div className="bg-[#E4EEF8] border-b border-[#c0d0e0] p-3 flex items-start justify-between">
                <div>
                  <span className="bg-[#005A9C] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold mr-1.5">
                    {plan.id}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{plan.planName}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  plan.isActive 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Body */}
              <div className="p-3 text-xs space-y-3">
                {/* Price Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Monthly Subscription</div>
                    <div className="text-base font-black text-[#005A9C] font-mono">
                      {plan.monthlyPrice} AED <span className="text-xs font-normal text-slate-500">/ mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Daily Leave Credit</div>
                    <div className="text-xs font-bold text-slate-700 font-mono">
                      {plan.dailyPrice} AED / day
                    </div>
                  </div>
                </div>

                {/* Cuisine Badge */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-slate-600">Cuisine:</span>
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                    {plan.cuisineCategory.replace('_', ' ')}
                  </span>
                </div>

                {/* Meals Included */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5">Meals Included:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 font-semibold ${
                      plan.mealTypes.includes('BREAKFAST')
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-400 opacity-60'
                    }`}>
                      <Coffee className="w-3 h-3" /> Breakfast
                    </span>
                    <span className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 font-semibold ${
                      plan.mealTypes.includes('LUNCH')
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-400 opacity-60'
                    }`}>
                      <Sun className="w-3 h-3" /> Lunch
                    </span>
                    <span className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 font-semibold ${
                      plan.mealTypes.includes('DINNER')
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-slate-100 text-slate-400 opacity-60'
                    }`}>
                      <Moon className="w-3 h-3" /> Dinner
                    </span>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                    "{plan.description}"
                  </p>
                )}
              </div>

              {/* Action Footer */}
              <div className="bg-[#f0ece1] border-t border-[#d0d0d0] px-3 py-1.5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {plan.mealTypes.length} Meal(s) Daily
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEditModal(plan)}
                    className="p-1 text-slate-600 hover:text-[#005A9C] hover:bg-white rounded cursor-pointer"
                    title="Edit Plan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === plan.id ? (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 py-0.5 bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(plan.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 4. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ece1] border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Modal Header */}
            <div className="bg-[#00A2E8] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#FFB800]" />
                {editingPlan ? `Edit Food Package (${editingPlan.id})` : 'New Meal / Mess Plan (MESS)'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan}>
              <div className="p-4 bg-white text-xs space-y-3">
                
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Plan Display Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 3-Times Daily Meals (Breakfast + Lunch + Dinner)"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Cuisine Category
                    </label>
                    <select 
                      value={formData.cuisineCategory}
                      onChange={(e) => setFormData({ ...formData, cuisineCategory: e.target.value as any })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                    >
                      <option value="KERALA">KERALA CUISINE</option>
                      <option value="NORTH_INDIAN">NORTH INDIAN</option>
                      <option value="SOUTH_INDIAN">SOUTH INDIAN</option>
                      <option value="ARABIC">ARABIC</option>
                      <option value="CONTINENTAL">CONTINENTAL / ASIAN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Status
                    </label>
                    <select 
                      value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Meals Included (Select at least one)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => toggleMealType('BREAKFAST')}
                      className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.mealTypes?.includes('BREAKFAST')
                          ? 'bg-blue-100 border-blue-400 text-blue-900'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" /> Breakfast
                    </button>
                    <button 
                      type="button"
                      onClick={() => toggleMealType('LUNCH')}
                      className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.mealTypes?.includes('LUNCH')
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Lunch
                    </button>
                    <button 
                      type="button"
                      onClick={() => toggleMealType('DINNER')}
                      className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.mealTypes?.includes('DINNER')
                          ? 'bg-purple-100 border-purple-400 text-purple-900'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Dinner
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Monthly Price (AED) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 400"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono font-bold text-[#005A9C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Daily Deduction Rate (AED)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={formData.dailyPrice}
                      onChange={(e) => setFormData({ ...formData, dailyPrice: Number(e.target.value) })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Package Description &amp; Menu Notes
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Fresh meals delivered directly to tenant flat kitchen morning, noon, and night."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 italic">
                  * Plans will be available during tenant registration.
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1 bg-[#00A2E8] hover:bg-[#0089C7] border border-[#007BB3] text-white rounded text-xs font-bold cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Food Package
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
