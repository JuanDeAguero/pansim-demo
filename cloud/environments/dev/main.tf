module app {
    source = "../../modules/app"

    env                 = var.env
    desired_task_count  = var.desired_task_count
    vpc_id              = module.network.vpc_id
    subnet_values       = module.network.subnet_values
    sg_id_application   = module.network.sg_id_application
    aws_route53_zone_id = module.network.aws_route53_zone_id
    db_endpoint         = module.data.db_endpoint
    db_name             = module.data.db_name
    db_host             = module.data.db_host 
    db_port             = module.data.db_port

    depends_on = [ 
        module.network 
    ]
}

module network {
    source = "../../modules/network"

    vpc_cidr_block = var.vpc_cidr_block
    env            = var.env
    subnet_list    = var.subnet_list
}

module data {
    source = "../../modules/data"
    
    env = var.env
    subnet_values       = module.network.subnet_values
    vpc_id              = module.network.vpc_id
    vpc_cidr_block      = var.vpc_cidr_block
}

module batch_simulation_environment {
    source = "../../modules/batch"

    env                 = var.env
    subnet_values       = module.network.subnet_values
    vpc_id              = module.network.vpc_id
    db_endpoint         = module.data.db_endpoint
    db_name             = module.data.db_name
    db_host             = module.data.db_host 
    db_port             = module.data.db_port  
}