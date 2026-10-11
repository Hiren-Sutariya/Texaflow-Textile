from app.schemas.domain import JobCostingResponse

class CostingService:
    @staticmethod
    def calculate_job_costing(
        job_work_id: str,
        jw_number: str,
        party_name: str,
        total_produced_pieces: int,
        rate_per_piece: float,
        material_costs: float,
        worker_costs: float,
        machine_hourly_rate: float,
        total_machine_hours: float,
        electricity_rate_per_hour: float = 45.0,
        allocated_overhead: float = 500.0
    ) -> JobCostingResponse:
        """
        Calculates job-level profitability using exact formula:
        Revenue - Material Cost - Worker Cost - Machine Cost - Electricity - Overhead = Profit
        """
        total_revenue = total_produced_pieces * rate_per_piece
        machine_cost = total_machine_hours * machine_hourly_rate
        electricity_cost = total_machine_hours * electricity_rate_per_hour
        
        total_cost = (
            material_costs +
            worker_costs +
            machine_cost +
            electricity_cost +
            allocated_overhead
        )
        
        net_profit = total_revenue - total_cost
        profit_margin = (net_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0
        profit_per_piece = (net_profit / total_produced_pieces) if total_produced_pieces > 0 else 0.0
        
        return JobCostingResponse(
            job_work_id=job_work_id,
            jw_number=jw_number,
            party_name=party_name,
            total_revenue=round(total_revenue, 2),
            material_cost=round(material_costs, 2),
            worker_cost=round(worker_costs, 2),
            machine_cost=round(machine_cost, 2),
            electricity_cost=round(electricity_cost, 2),
            allocated_overhead=round(allocated_overhead, 2),
            total_cost=round(total_cost, 2),
            net_profit=round(net_profit, 2),
            profit_margin_percent=round(profit_margin, 2),
            profit_per_piece=round(profit_per_piece, 2),
            is_costing_complete=True
        )
