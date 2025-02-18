env                 = "dev"
desired_task_count  = 1
vpc_cidr_block      = "10.0.0.0/16"
subnet_list = [
    {
        "name" = "subnet-priv-pansim-dev-app-01"
        "cidr" = "10.0.0.0/20"
        "az"   = "ca-central-1a"
        "type" = "private"
    },
    {
        "name" = "subnet-priv-pansim-dev-app-02"
        "cidr" = "10.0.16.0/20"
        "az"   = "ca-central-1b"
        "type" = "private"
    },
    {
        "name" = "subnet-priv-pansim-dev-data-01"
        "cidr" = "10.0.32.0/20"
        "az"   = "ca-central-1a"
        "type" = "private"
    },
    {
        "name" = "subnet-priv-pansim-dev-data-02"
        "cidr" = "10.0.48.0/20"
        "az"   = "ca-central-1b"
        "type" = "private"
    },
    {
        "name" = "subnet-pub-pansim-dev-app-01"
        "cidr" = "10.0.64.0/20"
        "az"   = "ca-central-1a"
        "type" = "public"
    },
    {
        "name" = "subnet-pub-pansim-dev-app-02"
        "cidr" = "10.0.80.0/20"
        "az"   = "ca-central-1b"
        "type" = "public"
    }
]